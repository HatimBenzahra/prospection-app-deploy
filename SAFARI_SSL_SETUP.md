# Configuration SSL pour Safari 🔒

## Problème

Safari bloque les certificats auto-signés, ce qui empêche l'accès à `https://192.168.1.120:5173`.

## Solutions pour Safari

### Solution 1 : Accepter manuellement le certificat

1. **Ouvrir l'URL directement** : 
   - Tapez `https://192.168.1.120:5173` dans Safari
   - Safari affichera "Cette connexion n'est pas privée"
   - Cliquez sur "Afficher les détails"
   - Cliquez sur "Visiter ce site web"
   - Cliquez sur "Visiter"

2. **Pour le serveur Python** (si nécessaire) :
   - Visitez aussi `https://192.168.1.120:8443` 
   - Acceptez le certificat de la même manière

### Solution 2 : Désactiver les vérifications SSL dans Safari (Développement uniquement)

1. Dans Safari : **Préférences** > **Avancées**
2. Cochez **"Afficher le menu Développement dans la barre des menus"**
3. Dans le menu **Développement** > **Désactiver les restrictions de certificat SSL**
4. Relancez Safari

### Solution 3 : Ajouter le certificat au trousseau (Recommandé)

```bash
# Ouvrir le certificat dans le trousseau
open backend/ssl/server.cert
```

1. Dans **Trousseau d'accès**, double-cliquez sur le certificat
2. Dépliez **"Faire confiance"**
3. Pour **"Lors de l'utilisation de ce certificat"** → Sélectionnez **"Toujours faire confiance"**
4. Fermez la fenêtre (entrez votre mot de passe si demandé)

## Pour tester

Une fois l'une des solutions appliquée :

1. **Frontend** : `https://192.168.1.120:5173`
2. **Serveur Python HTTP** : `http://192.168.1.120:8080/health`
3. **Serveur Python HTTPS** : `https://192.168.1.120:8443/health`

## Redémarrer les serveurs

```bash
# Serveur Python audio
python3 audio_streaming_server.py

# Serveur Frontend (dans un autre terminal)
cd moduleProspec-1dc4f634c6c14f0913f8052d2523c56f04d7738b
npm run dev
```

La détection automatique choisira HTTPS si vous accédez via HTTPS, et HTTP si vous accédez via HTTP.