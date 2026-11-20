# Secret Santa familial

Application web monopage en français, conçue autour des maquettes Figma fournies dans le dépôt. Elle conserve le fond bleu pastel, les tons brun/rouge/beige, le titre en arc, l'illustration du Père Noël et la liste à deux colonnes. Les écrans s'enchaînent sans rechargement.

## Architecture

- Interface statique (`index.html`, `styles.css`, `app.js`, `santa.svg`) hébergeable sur Netlify, Vercel ou un autre hébergeur statique.
- Supabase fournit PostgreSQL et trois Edge Functions : `participants` (noms seulement), `reveal` (un destinataire par requête) et `setup` (gestion protégée des prénoms).
- La clé publique anon est prévue pour le navigateur. La clé `service_role` et le jeton administrateur ne doivent jamais être ajoutés au dépôt ou au frontend.
- Le tirage est produit côté serveur une seule fois au premier clic. Les associations restent dans une table protégée, et une contrainte garantit qu'aucun destinataire n'est attribué deux fois ni à soi-même.

## Configuration et publication

1. Crée un projet Supabase et exécute les migrations SQL dans l'ordre : `supabase/migrations/0001_secret_santa.sql`, puis `supabase/migrations/0002_atomic_setup.sql`.
2. Déploie les fonctions :
   ```sh
   supabase functions deploy participants
   supabase functions deploy reveal
   supabase functions deploy setup
   ```
3. Configure les secrets des fonctions, si nécessaire :
   ```sh
   supabase secrets set SUPABASE_URL=https://<projet>.supabase.co SUPABASE_ANON_KEY=<clé-publique> SUPABASE_SERVICE_ROLE_KEY=<clé-service-role> ADMIN_TOKEN=<long-secret-aleatoire>
   ```
   Utilise un jeton administrateur long, aléatoire et gardé hors du dépôt. La `service_role` est encore plus sensible : ne la communique jamais aux participants.
4. Renseigne `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans `config.js`. La clé anon est publique ; ne mets jamais la clé service-role dans ce fichier.
5. Ouvre le site, va dans « Gérer les participants », saisis le jeton administrateur et la liste (un prénom par ligne), puis enregistre. Tu peux aussi configurer la liste initiale par POST sur `/functions/v1/setup`, avec l'en-tête `x-admin-token` et le JSON `{"names":["Alice","Bob"]}`. Les noms doivent être uniques sans tenir compte de la casse.
6. Héberge les fichiers statiques. GitHub Pages seul ne fournit pas le backend sécurisé ; il faut aussi le projet Supabase.

En local : `python3 -m http.server 8000`, puis ouvre `http://localhost:8000` après configuration.

## Confidentialité : limites à comprendre

Le navigateur ne reçoit jamais la table complète des associations. La fonction de tirage crée et persiste les résultats côté serveur, puis la fonction `reveal` retourne uniquement le destinataire associé à l'identifiant demandé. Les accès directs anon/authenticated aux associations sont révoqués par la migration.

**Sans compte, code individuel ou lien privé, aucune identité n'est vérifiée.** Les identifiants des participants sont publics avec la liste ; toute personne capable d'appeler l'API peut demander le résultat de n'importe quel participant. Cette conception ne garantit donc pas que seul le destinataire légitime voit son résultat. Protéger réellement chaque résultat exige un secret/lien privé unique ou une authentification, contrairement à la demande de clic sans code.

L'interface n'offre pas à l'organisatrice une vue des associations, mais cela ne garantit pas qu'elle ne puisse pas les connaître. Une personne ayant les droits du projet Supabase (notamment accès SQL, propriétaire, ou clé service-role) peut lire la base et retrouver les associations. Pour réduire le risque, sépare la gestion technique du tirage et limite strictement les accès au tableau de bord ; il reste impossible de promettre une ignorance totale à une administratrice disposant des privilèges de base de données. Le jeton d'administration autorise la modification de la liste avant tirage, et toute personne qui le connaît peut s'en servir.

## Vérifications conseillées après déploiement

- Accueil → liste et retour, sans rechargement ; vérifier le rendu sur mobile et ordinateur.
- Révéler plusieurs participants : aucun ne reçoit son propre nom et aucun destinataire n'est attribué deux fois.
- Recharger puis redemander un résultat : il doit être identique.
- Enregistrer une liste avant le tirage ; après un premier résultat, les modifications doivent répondre HTTP 409.
- Vérifier que les lectures anon de `assignments` échouent et que `participants` ne renvoie que les identifiants et prénoms.

Le dépôt ne contient pas les secrets ni les identifiants d'un projet Supabase : l'application nécessite cette configuration pour être opérationnelle en production.
