# Test et Diagnostic Automatique pour Holberton

## Initialisation des données de test
Avant tout test, lance :
```bash
node scripts/init_test_data.js
```
Cela crée l'utilisateur `bob@dylan.com` et un fichier root dans la base MongoDB.

## Test complet avec logs serveur
Pour lancer le serveur, exécuter les tests et afficher tous les logs serveur :
```bash
chmod +x scripts/test_with_logs.sh
./scripts/test_with_logs.sh
```

- Les résultats des tests s'affichent dans le terminal.
- Tous les logs serveur (requêtes, requêtes MongoDB, nombre de fichiers trouvés, erreurs) sont affichés à la fin.
- Le fichier `server_test.log` contient aussi tous les logs serveur.

## Diagnostic en cas de problème
- Si un test bloque ou timeout, vérifie les logs affichés.
- Pour voir le contenu de la base MongoDB :
```bash
node scripts/dump_db.js
```

## Conseils
- Toujours initialiser la base avant de tester.
- Utilise le script de test avec logs pour toute correction Holberton ou debug jail.
- Si tu rencontres un problème, copie les logs serveur pour un diagnostic rapide.

---

Projet prêt pour la validation Holberton.
