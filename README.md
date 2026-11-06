# JOM 2026 · Atelier « Les règles du jeu »

Atelier de la Journée Oser tous les Métiers 2026 (« Le monde de l'informatique »). Les participantes inventent les règles d'un petit jeu avec des blocs QUAND / SI / ALORS, puis prédisent, testent et corrigent des bugs.

- **Atelier** : ouvrir `index.html` (hors ligne, double-clic) ou la version en ligne : https://djguiaume.github.io/JOM-2026/
- **Jeu final** : à la fin de l'atelier, un QR code donne un lien qui contient tout le jeu créé (règles, personnage, monde). Il s'ouvre en mode « jouer », aussi sur téléphone.

## Modifier l'atelier

Les sources sont dans `src/` : `atelier.html` (structure et logique), `style.css`, `sprites-chars.js` (personnages), `sprites-world.js` (objets, obstacles, mondes), `qrcode.js` (qrcode-generator, MIT) et les polices Fredoka et Nunito (SIL OFL). Après une modification, lancer `python3 build.py` pour régénérer `index.html`, un fichier unique qui marche hors ligne.
