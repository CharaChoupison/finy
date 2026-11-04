#!/bin/sh
# Passe Finy à la version suivante : APP_VERSION dans app.js et le cache du service worker dans sw.js
# (même numéro, affiché « V0.N » en bas des Réglages). À lancer après chaque modification de app.js ou styles.css.
#   sh scripts/bump-version.sh       → version suivante
#   sh scripts/bump-version.sh 40    → version 40
set -e
cd "$(dirname "$0")/.."

cur=$(sed -n "s/^  var APP_VERSION = \([0-9][0-9]*\);.*/\1/p" app.js)
cache=$(sed -n "s/^var CACHE = 'finy-v\([0-9][0-9]*\)';.*/\1/p" sw.js)
if [ -z "$cur" ] || [ -z "$cache" ]; then
  echo "Numéro de version introuvable dans app.js ou sw.js" >&2
  exit 1
fi
[ "$cur" = "$cache" ] || echo "Attention : app.js (v$cur) et sw.js (v$cache) n'avaient pas le même numéro" >&2

max=$cur
[ "$cache" -gt "$max" ] && max=$cache
next=${1:-$((max + 1))}
case "$next" in
  ''|*[!0-9]*) echo "La version doit être un nombre : $next" >&2; exit 1 ;;
esac

# -i.bak marche avec le sed de macOS comme avec celui de Linux.
sed -i.bak "s/^  var APP_VERSION = [0-9][0-9]*;/  var APP_VERSION = $next;/" app.js
sed -i.bak "s/^var CACHE = 'finy-v[0-9][0-9]*';/var CACHE = 'finy-v$next';/" sw.js
rm -f app.js.bak sw.js.bak
echo "Finy passe en V0.$next (app.js et sw.js)"
