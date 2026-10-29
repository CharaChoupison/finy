# Finy

Web app pour savoir ce qu'il te reste chaque mois, après ton épargne et tes abonnements. Elle s'installe sur l'écran d'accueil du téléphone et marche hors ligne. Toutes les données restent sur l'appareil (stockage du navigateur) : rien n'est envoyé sur internet.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | La page, la barre d'onglets et la fenêtre qui monte du bas |
| `styles.css` | Le design (couleurs du design system Finy, thèmes clair et sombre) |
| `app.js` | Toute la logique : les 5 écrans, les calculs, les rappels, la sauvegarde |
| `manifest.webmanifest` | Nom, icône et couleurs de l'app installée |
| `sw.js` | Garde l'app disponible sans connexion |
| `icons/` | Icône de l'app (180, 192 et 512 px) |
| `vendor/pdfjs/` | [pdf.js](https://mozilla.github.io/pdf.js/) 3.11.174 (Mozilla, licence Apache 2.0), pour lire les factures et relevés en PDF |

## Objectifs d'épargne

Dans **Épargne**, touche **Nouvel objectif** : un nom, le montant à atteindre, ce que tu as déjà de côté et une durée (en mois ou en ans). Finy calcule ce qu'il faut mettre de côté chaque mois, et le recalcule au fil des mois avec le temps qui reste. Pour avancer, ouvre l'objectif et mets à jour **Déjà de côté**. Si tes objectifs demandent plus que ton épargne mensuelle, un lien te propose d'ajuster ton épargne au bon montant.

## Importer un relevé ou une facture

Dans **Abonnements**, touche **Ajouter** puis **Importer un relevé ou une facture** (ou le lien en bas de la liste).

- **Relevé bancaire en CSV** (Revolut, BNP, Caisse d'Épargne, PayPal…) : Finy repère les paiements qui reviennent chaque mois ou chaque année au même montant, et te propose une liste à cocher. Il faut au moins deux prélèvements par abonnement, donc un relevé de plusieurs mois. Si le format n'est pas reconnu, Finy te demande quelle colonne contient la date, le libellé et le montant.
- **Facture en PDF** : Finy remplit le formulaire (service, montant total, fréquence, jour) et tu vérifies avant d'ajouter. Les PDF scannés (images) ne sont pas lisibles.
- **Relevé en PDF** : lu comme un CSV, mais le sens des opérations (débit ou crédit) se perd souvent : décoche ce qui n'est pas un abonnement.

Le fichier est lu sur le téléphone et n'est jamais envoyé.

## Mettre en ligne sur GitHub Pages

1. Crée un compte sur [github.com](https://github.com) si tu n'en as pas.
2. Crée un nouveau dépôt (bouton **New**), par exemple `finy`. Laisse-le **Public** : GitHub Pages est gratuit pour les dépôts publics.
3. Dans le dépôt, clique **Add file › Upload files**. Glisse **le contenu** du dossier `finy` (les fichiers et le dossier `icons`, pas le dossier `finy` lui-même), puis **Commit changes**.
4. Va dans **Settings › Pages**. Sous **Branch**, choisis `main` et `/ (root)`, puis **Save**.
5. Après une à deux minutes, ton site est en ligne à l'adresse `https://<ton-pseudo>.github.io/finy/`.

Ton code est visible par tout le monde, mais pas tes données : elles restent sur ton téléphone.

## L'installer sur l'iPhone

1. Ouvre l'adresse dans **Safari**.
2. Touche **Partager**, puis **Sur l'écran d'accueil**, puis **Ajouter**.
3. Ouvre Finy depuis son icône. Elle s'affiche en plein écran, comme une app.

Pour les rappels, va dans **Réglages › Rappels**, active-les et accepte l'autorisation. Ils sont vérifiés à chaque ouverture de Finy.

## L'utiliser sur ordinateur

Ouvre la même adresse dans ton navigateur. À partir de 960 px de large, Finy passe en mise en page ordinateur : un menu fixe à gauche (avec Réglages en bas), des écrans sur deux colonnes, et des fenêtres centrées. Dans Chrome ou Edge, tu peux aussi l'installer comme une app avec l'icône d'installation dans la barre d'adresse.

Les données ne sont pas partagées entre le téléphone et l'ordinateur : chaque appareil garde les siennes. Pour passer de l'un à l'autre, utilise **Exporter** puis **Importer une sauvegarde**.

## Mettre à jour

Remplace les fichiers modifiés dans le dépôt GitHub (**Add file › Upload files**). Si tu modifies `app.js` ou `styles.css`, change aussi `finy-v1` en `finy-v2` (puis `v3`…) au début de `sw.js`, pour que les téléphones récupèrent bien la nouvelle version. Si l'ancienne version s'affiche encore, ferme Finy complètement et rouvre-la, ou utilise **Réglages › Recharger Finy**.

## Sauvegarde

**Réglages › Exporter une sauvegarde** crée un fichier `.json` avec tout ton budget. **Importer une sauvegarde** le recharge, par exemple sur un nouveau téléphone. Pense à exporter de temps en temps : si tu effaces les données de Safari, ou si tu supprimes l'app de l'écran d'accueil, les données disparaissent.
