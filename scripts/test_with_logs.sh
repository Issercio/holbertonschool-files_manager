#!/bin/bash
# Script pour lancer le serveur, exécuter le test et capturer tous les logs

LOGFILE=server_test.log

# Kill any previous server
pkill -f "node server.js" 2>/dev/null

# Démarre le serveur en arrière-plan, capture les logs
node server.js > $LOGFILE 2>&1 &
SERVER_PID=$!

# Attend que le serveur affiche qu'il est prêt
sleep 3

echo "[INFO] Serveur Express lancé (PID $SERVER_PID), logs dans $LOGFILE"

# Lance le test
npm run test ./test/hbtn_test_5.test.cjs

# Affiche les logs serveur
echo "\n[INFO] Logs serveur Express :"
cat $LOGFILE

# Stoppe le serveur
kill $SERVER_PID
