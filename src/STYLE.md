# Direction artistique du jeu « Les règles du jeu » (partagée)

Public : filles de 10 à 13 ans, jeu affiché sur une grande télé (sprites vus à ~40-60 px) et sur téléphone.
Style : illustration vectorielle plate « autocollant », contour encre épais, formes rondes et joyeuses, lisible de loin.

- Dessin 100 % Canvas 2D, déterministe, aucune image externe, aucun emoji, aucun texte dans les sprites.
- Repère : chaque sprite est dessiné dans une boîte unité de 100×100 centrée sur (0,0) (de -50 à +50). L'appelant fait translate(x,y) + scale(size/100).
- Contour : couleur encre #1d1b2f, lineWidth 4.5 (dans l'unité 100), lineJoin/lineCap "round". Tout objet principal a un contour.
- Ombre portée : ellipse plate rgba(29,27,47,.18) sous le sprite (y ≈ +40), sauf décors plats.
- Palette (n'utiliser que celles-ci, + blanc et encre) :
  corail #ff6b4a · tournesol #ffc83d · turquoise #14b8a6 · indigo #4f5bd5 · rose #ff8fb1 · feuille #5cc26b · ciel #7cc8f2 · crème #fbf6ea · bois #9a6b4a · gris #8a8fa3 · violet #8b5cf6
- Un reflet blanc (petite courbe ou point, alpha .7) par objet pour le volume. Pas de dégradés complexes.
- Animation : paramètre t en secondes ; seulement des mouvements discrets (rebond 2-3 unités, battement d'ailes, roue qui tourne, clignement d'yeux toutes les ~3 s). Jamais de déplacement hors de la boîte.
- Les personnages et créatures ont des yeux ronds blancs avec pupille encre, expression souriante.
