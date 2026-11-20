# Secret Santa familial

Application monopage statique conçue autour des maquettes Figma du dépôt : fond bleu pastel, tons brun/rouge/beige, titre en arc, Père Noël illustré et liste des participants en deux colonnes. Les écrans s'enchaînent sans rechargement.

## Version actuelle : page statique et confiance familiale

La page utilise une liste de dix participants et un tirage fixe dans `app.js`. Il n'y a aucun appel à Supabase, aucun compte, aucun code à saisir et aucun serveur nécessaire au fonctionnement du site. Chaque personne choisit son prénom dans la liste pour voir son destinataire, puis peut revenir à la liste.

**Important : ce choix repose entièrement sur la confiance.** Comme le tirage est livré avec le code public du site, toute personne peut inspecter les fichiers JavaScript et consulter toutes les associations. Le bouton « Révéler » ne constitue pas un contrôle d'accès. Cette version ne peut donc pas assurer que chacun ne voie que son résultat, ni garantir que l'organisatrice ignore le tirage. Ne publiez pas cette version si cette limite ne convient pas à la famille.

Le tirage intégré attribue une personne à chacun, sans auto-attribution et sans destinataire en double. Il reste identique après actualisation. Pour changer la liste ou le tirage, modifiez les associations dans `app.js` avant de partager le site et vérifiez les contraintes ci-dessus.

## Publication sur GitHub Pages

Les fichiers du site sont statiques et peuvent être publiés via GitHub Pages : dans les paramètres du dépôt, ouvrez **Pages**, sélectionnez **Deploy from a branch**, choisissez `main` et `/ (root)`, puis enregistrez. Une fois la publication terminée, partagez l'URL Pages avec la famille. Il n'y a pas de backend à configurer.

Pour tester en local, lancez `python3 -m http.server 8000` à la racine du dépôt, puis ouvrez `http://localhost:8000`.

## Participants

Thomas, Mamé, Nathalie, Martin, Zoé, Seb, Papé, Jean, Agathe et Marion.

Les anciens fichiers Supabase présents dans `supabase/` ne sont plus utilisés par l'interface statique. Ne les déployez pas pour cette version.
