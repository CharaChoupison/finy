# Serveur de rappels de Finy

Un petit serveur gratuit (Cloudflare Workers) qui réveille Finy à 9 h les jours où un rappel est prévu, même quand l'app est fermée.

## Ce que le serveur sait, et ce qu'il ne sait pas

- **Il garde** : l'adresse push de chaque appareil (fournie par Apple, Google ou Mozilla), une empreinte de son jeton secret, et les heures de réveil (un par jour au plus).
- **Il ne reçoit jamais** : le nom d'un abonnement, un montant, ton salaire ou quoi que ce soit d'autre. Le push qu'il envoie est vide ; c'est Finy, sur le téléphone, qui écrit le texte du rappel.
- **Protections** : seules les adresses des services de push officiels sont acceptées, seul le site Finy peut lui parler (`ALLOWED_ORIGINS`), chaque appareil a un jeton secret pour modifier ou effacer ses réveils, les requêtes sont limitées en taille et en fréquence, et le nombre d'appareils est plafonné (`MAX_DEVICES`).
- **Ménage automatique** : un appareil qui ne donne plus de nouvelles pendant 60 jours est oublié, comme un abonnement push supprimé.

## Coût

Rien. L'offre gratuite de Cloudflare permet 100 000 requêtes par jour et 5 tâches planifiées ; Finy en utilise quelques dizaines. Si une limite était dépassée, les requêtes en trop échoueraient jusqu'au lendemain : pas de facture.

## Mise en ligne (une seule fois)

Il faut un compte Cloudflare gratuit ([dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)) et Node.js. Toutes les commandes se lancent dans ce dossier `push-server`.

1. Installe les outils et connecte-toi (une page Cloudflare s'ouvre pour autoriser l'accès) :

   ```bash
   npm install
   npx wrangler login
   ```

2. Crée la base de données, puis copie le `database_id` affiché à la place de `A_REMPLACER` dans `wrangler.toml` :

   ```bash
   npx wrangler d1 create finy-push
   ```

3. Crée les clés qui signent les envois, puis enregistre-les comme secrets (colle chaque clé quand c'est demandé) :

   ```bash
   npm run keys
   npx wrangler secret put VAPID_PUBLIC_KEY
   npx wrangler secret put VAPID_PRIVATE_KEY
   ```

   La clé privée ne doit jamais aller dans un fichier du dépôt. Si tu la perds, recrée une paire : les téléphones se réabonneront tout seuls à la prochaine ouverture de Finy.

4. Mets le serveur en ligne :

   ```bash
   npm run deploy
   ```

   L'adresse s'affiche à la fin, par exemple `https://finy-push.ton-compte.workers.dev`.

5. Branche Finy sur le serveur :
   - dans `app.js`, mets l'adresse dans `PUSH_URL` (sans `/` à la fin) ;
   - dans `index.html`, ajoute-la à `connect-src` dans la ligne `Content-Security-Policy` : `connect-src 'self' https://finy-push.ton-compte.workers.dev;` ;
   - incrémente la version (`APP_VERSION` dans `app.js` et `CACHE` dans `sw.js`), puis publie Finy sur GitHub Pages.

6. Sur l'iPhone, ouvre Finy depuis l'écran d'accueil, puis **Réglages › Rappels › Même quand Finy est fermée**.

## Tester

Pour recevoir un réveil à la prochaine heure pile, sans attendre un vrai prélèvement :

```bash
npx wrangler d1 execute finy-push --remote --command "INSERT OR IGNORE INTO pushes SELECT id, unixepoch() FROM devices"
```

Finy affiche alors les rappels du jour, ou « Ouvre Finy pour voir tes prochains prélèvements » s'il n'y en a pas. Pour suivre les passages du serveur en direct : `npx wrangler tail`.

## Réglages

Dans `wrangler.toml`, section `[vars]` (puis `npm run deploy`) :

| Variable | Rôle |
| --- | --- |
| `ALLOWED_ORIGINS` | Sites autorisés, séparés par des virgules (ex. ajouter l'adresse Netlify de la bêta) |
| `VAPID_SUBJECT` | Contact transmis aux services de push (une adresse `https://` ou `mailto:`) |
| `MAX_DEVICES` | Nombre d'appareils maximum |

L'heure des rappels (9 h) se règle avec `PUSH_HOUR` dans `app.js`.

## Développer en local

Crée un fichier `.dev.vars` (jamais publié) :

```
ALLOWED_ORIGINS=http://localhost:8766
VAPID_PUBLIC_KEY=…
VAPID_PRIVATE_KEY=…
```

Puis `npm run dev` : le serveur tourne sur `http://localhost:8787`, et `curl http://localhost:8787/cdn-cgi/handler/scheduled` déclenche un passage d'envoi.
