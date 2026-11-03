// Crée la paire de clés VAPID qui signe les envois de push. À lancer une seule fois.
const { webcrypto: crypto } = await import('node:crypto');

const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pub = Buffer.from(await crypto.subtle.exportKey('raw', pair.publicKey)).toString('base64url');
const priv = (await crypto.subtle.exportKey('jwk', pair.privateKey)).d;

console.log('Clé publique  : ' + pub);
console.log('Clé privée    : ' + priv);
console.log('\nGarde la clé privée pour toi : ne la mets jamais dans un fichier du dépôt.');
