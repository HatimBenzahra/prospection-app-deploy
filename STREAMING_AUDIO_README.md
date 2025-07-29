# Système d'Écoute Audio en Temps Réel 🎵

## Vue d'ensemble

Ce système permet aux administrateurs d'écouter en temps réel les conversations entre les commerciaux et les clients. Il utilise WebRTC pour un streaming audio haute qualité et supporte plusieurs administrateurs écoutant simultanément.

## Architecture

### Serveur Python (WebRTC)
- **Fichier**: `audio_streaming_server.py`
- **Port**: 8080
- **Technologie**: aiortc (WebRTC), Socket.IO pour la signalisation
- **Fonctionnalités**:
  - Streaming audio haute qualité (48kHz, réduction de bruit)
  - Support multi-listeners (plusieurs admins peuvent écouter)
  - Gestion automatique des connexions/déconnexions
  - API REST pour monitoring

### Côté Frontend

#### Page Admin (`SuiviPage.tsx`)
- Boutons d'écoute pour chaque commercial en ligne
- Panneau de contrôle audio flottant avec réglage du volume
- Indicateurs visuels (LIVE, statut de connexion)
- Gestion des erreurs en temps réel

#### Page Commercial (`ProspectingDoorsPage.tsx`)
- Panneau de streaming audio en haut à droite
- Bouton pour démarrer/arrêter le streaming
- Indicateurs de statut (connecté, streaming)
- Notifications pour informer l'utilisateur

## Installation

### 1. Installer les dépendances Python

```bash
cd /Users/hatimbenzahra/Desktop/frontetback
pip install -r requirements.txt
```

### 2. Démarrer le serveur de streaming

```bash
# Option 1: Script de démarrage automatique
python start_audio_server.py

# Option 2: Démarrage direct
python audio_streaming_server.py
```

### 3. Vérifier que le serveur fonctionne

Le serveur sera accessible sur `http://localhost:8080`

Vous pouvez vérifier le statut avec:
```bash
curl http://localhost:8080/health
```

## Utilisation

### Pour les Commerciaux

1. Ouvrir la page de prospection des portes
2. Le panneau audio apparaît en haut à droite
3. Cliquer sur le bouton microphone pour démarrer le streaming
4. L'indicateur "LIVE" apparaît quand le streaming est actif
5. Les supérieurs peuvent maintenant écouter les conversations

### Pour les Administrateurs

1. Ouvrir la page de suivi GPS
2. Les commerciaux en ligne ont un bouton casque 🎧
3. Cliquer sur le bouton pour commencer l'écoute
4. Un panneau de contrôle apparaît en bas à droite
5. Régler le volume avec le slider
6. Cliquer sur le bouton rouge pour arrêter l'écoute

## Fonctionnalités Avancées

### Multi-Écoute
- Plusieurs administrateurs peuvent écouter le même commercial simultanément
- Chaque admin a son propre contrôle de volume
- Pas de limite sur le nombre d'écouteurs

### Qualité Audio
- Échantillonnage à 48kHz
- Réduction de bruit automatique
- Contrôle automatique du gain
- Annulation d'écho

### Sécurité et Permissions
- Seuls les utilisateurs avec le rôle 'admin' peuvent écouter
- Les commerciaux sont informés quand ils streamemt
- Logs détaillés pour audit

## Configuration

### URL du Serveur
Dans les fichiers React, l'URL du serveur est configurée à:
```typescript
serverUrl: 'http://localhost:8080'
```

Pour la production, changez cette URL vers votre serveur de production.

### SSL/HTTPS
Pour la production, décommentez les lignes SSL dans `audio_streaming_server.py`:
```python
# ssl_context=await self.create_ssl_context()  # Décommentez pour HTTPS
```

Et configurez vos certificats SSL.

## API REST

### GET /api/streaming/status
Retourne le statut de tous les streams actifs:
```json
{
  "active_commercials": 2,
  "total_listeners": 3,
  "commercial_details": {
    "commercial_id_1": {
      "listeners_count": 2,
      "is_streaming": true
    }
  }
}
```

### GET /health
Vérification de santé du serveur:
```json
{
  "status": "ok"
}
```

## Dépannage

### Problèmes Courants

#### "Impossible de se connecter au serveur"
- Vérifiez que le serveur Python est démarré
- Vérifiez l'URL dans le code React
- Vérifiez les ports firewall

#### "Erreur lors de l'établissement de la connexion audio"
- Vérifiez les permissions microphone dans le navigateur
- Testez avec Chrome/Edge (meilleur support WebRTC)
- Vérifiez la connexion réseau

#### "Pas de son côté admin"
- Vérifiez le volume du navigateur
- Vérifiez que l'audio n'est pas coupé
- Testez avec des écouteurs

### Logs de Debug

Le serveur Python affiche des logs détaillés:
- `📡` Connexions Socket.IO
- `📍` Événements GPS
- `🎵` Événements audio
- `📞` Événements WebRTC
- `❌` Erreurs

## Évolutions Futures

### Fonctionnalités Prévues
- [ ] Enregistrement des conversations
- [ ] Qualité audio adaptative selon la bande passante
- [ ] Interface de monitoring temps réel
- [ ] Notifications push quand un commercial démarre
- [ ] Historique des sessions d'écoute
- [ ] Support vidéo (optionnel)

### Optimisations Performance
- [ ] Mise en cache des connexions WebRTC
- [ ] Compression audio adaptative
- [ ] Load balancing pour plusieurs serveurs
- [ ] Clustering Redis pour scalabilité

## Support

Pour tout problème ou question:
1. Vérifiez les logs du serveur Python
2. Vérifiez la console développeur du navigateur
3. Testez la connexion réseau
4. Vérifiez les permissions navigateur