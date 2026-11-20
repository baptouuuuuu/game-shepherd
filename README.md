# Game Shepherd

Un petit jeu de berger jouable directement dans le navigateur, sans installation ni menu.
Guide tous les moutons dans l'enclos en les approchant par l'arrière. Ils réagissent
au chien, au troupeau et aux obstacles ; le chien accélère progressivement et ne
peut pas tourner instantanément.

## Jouer

Sur écran tactile, touche ou fais glisser ton doigt sur le pré pour guider le chien.
À la souris, clique ou maintiens le bouton enfoncé. Les flèches et les touches
ZQSD/WASD permettent aussi de le déplacer. Le bouton « Recommencer » relance le
niveau courant. Six niveaux traversent trois terrains.

Pour lancer le jeu localement, exécute `python3 -m http.server 8000` à la racine
du projet puis ouvre <http://localhost:8000>. Les tests s'exécutent avec
`node --test`.

## GitHub Pages

Après fusion sur `main`, active GitHub Pages dans **Settings → Pages**, en
choisissant **GitHub Actions** comme source. Le workflow déploie automatiquement
le site à chaque modification de `main`. Le jeu utilise uniquement des chemins
relatifs et fonctionne à l'adresse `https://<utilisateur>.github.io/game-shepherd/`.
La publication d'un dépôt privé dépend de l'offre et des paramètres GitHub du
compte ; si nécessaire, rends le dépôt public ou utilise une offre compatible.
