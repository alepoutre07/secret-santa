# Secret Santa familial

Application légère en français, fidèle aux captures fournies : fond bleu pastel, texte brun, boutons rouges arrondis, titre en arc, Père Noël illustré et liste en deux colonnes. L'interface est statique et peut être hébergée sur tout hébergeur de fichiers statiques ; Supabase fournit la base et les fonctions côté serveur.

## Participants de départ

La liste des captures est : Thomas, Mamé, Nathalie, Martin, Zoé, Seb, Papé, Jean, Agathe et Marion. Le tirage n'a pas lieu tant que quelqu'un n'appuie pas sur « Révéler ».

## Configuration et lancement

1. Crée un projet Supabase et exécute `supabase/migrations/0001_secret_santa.sql` dans le SQL Editor.
2. Déploie les fonctions `participants`, `reveal` et `setup` avec la CLI Supabase (`supabase functions deploy participants`, etc.). Configure les secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` et un long `ADMIN_TOKEN` secret côté serveur. Ne publie jamais la clé service-role ni le jeton administrateur.
3. Modifie `config.js` avec l'URL du projet et la clé anon publique. La clé anon est conçue pour être exposée ; la sécurité repose sur RLS et les fonctions.
4. Configure la liste initiale via `setup` (requête POST vers `/functions/v1/setup`, entête `x-admin-token: <ADMIN_TOKEN>`, corps `{"names":["Thomas","Mamé","Nathalie","Martin","Zoé","Seb","Papé","Jean","Agathe","Marion"]}`). Cette route permet de modifier la liste avant le tirage et la verrouille après.
5. Publie `index.html`, `app.js`, `config.js`, `styles.css` et `santa.svg` sur un hébergeur statique (Netlify, Vercel, etc.). GitHub Pages seul ne fournit pas les fonctions backend.

Exécuter localement : `python3 -m http.server 8000`, puis ouvrir `http://localhost:8000` après configuration.

## Tirage et confidentialité (limite assumée)

Le tirage est créé côté serveur au premier clic, dans une fonction PostgreSQL transactionnelle avec verrou consultatif. Il mélange les destinataires et rejette chaque permutation contenant une attribution à soi-même. Les contraintes d'unicité garantissent qu'aucun destinataire n'est attribué deux fois. Une fois créé, le tirage est conservé et la liste est verrouillée. La fonction de révélation renvoie uniquement le destinataire demandé ; la table des associations n'est pas lisible par la clé publique.

**Aucun lien privé ni contrôle d'identité n'est utilisé, conformément au choix demandé.** Les noms et identifiants des participants sont publics ; chacun peut cliquer sur n'importe quel bouton ou appeler la fonction de révélation avec l'identifiant d'un autre participant. Ainsi, les résultats ne sont pas confidentiels entre participants et le serveur ne peut pas garantir que chacun ne découvre que son propre résultat. Le backend évite de publier la liste complète des associations dans une seule réponse, mais ce n'est pas une barrière d'accès par personne.

L'administratrice peut gérer les participants avant le tirage avec le jeton de configuration, mais ne dispose d'aucune vue des associations dans l'interface. Néanmoins, toute personne ayant le contrôle du projet Supabase, de ses secrets ou du serveur peut techniquement récupérer ou modifier les données. Ne pas prétendre à une confidentialité vis-à-vis de l'administratrice/hébergeur sans séparation de contrôle et de clés.

## Tests manuels à vérifier après déploiement

- Accueil → liste ; les 10 participants et un bouton de révélation chacun s'affichent.
- Cliquer les boutons teste les résultats ; aucun participant ne reçoit son propre nom et chaque destinataire est unique.
- Recharger puis cliquer de nouveau conserve le résultat.
- Modifier la liste via la route `setup` avant le premier clic ; toute modification après le tirage doit renvoyer HTTP 409.
- La clé anon ne peut ni lire la table des associations, ni modifier la liste.
