# 🎤 Guide Complet du Système d'Écoute Audio

## Vue d'ensemble

Ce système permet aux administrateurs d'écouter en temps réel les conversations des commerciaux avec leurs clients. Il utilise WebRTC pour un streaming audio haute qualité et Socket.IO pour la signalisation.

---

## 🏗️ Architecture du Système

```
[Commercial] ──WebRTC──> [Serveur Python] ──WebRTC──> [Admin(s)]
     │                         │                         │
     └──GPS──> [Serveur Node.js] <──GPS Dashboard──────┘
```

### Composants Principaux

1. **Frontend React** - Interface utilisateur (commercial + admin)
2. **Serveur Python WebRTC** - Relais audio temps réel
3. **Serveur Node.js** - GPS et données métier existantes

---

## 🚀 Démarrage du Système

### 1. Serveur Audio Python
```bash
cd /Users/hatimbenzahra/Desktop/frontetback/backend/python-server
python3 audio_streaming_server.py
```

⚠️ **Important:** Le serveur audio est maintenant organisé dans le dossier `backend/python-server/` avec ses dépendances.
**Ports utilisés:**
- HTTP: `8080`
- HTTPS: `8443`

### 2. Frontend React
```bash
cd moduleProspec-1dc4f634c6c14f0913f8052d2523c56f04d7738b
npm run dev
```
**Accès:**
- Commercial: `https://192.168.1.120:5173/commercial/prospecting/doors/[ID]`
- Admin: `https://localhost:5173/admin/suivi`

---

## 👤 Côté Commercial

### Interface
- **Bouton flottant** en bas à droite (fixe)
- **Couleurs:**
  - 🔵 Bleu = Prêt à streamer
  - 🔴 Rouge = En streaming (avec animation pulse)
- **Indicateurs:**
  - Badge "LIVE" quand actif
  - Point vert/gris pour la connexion
  - Bulle d'info contextuelle

### Fonctionnement
1. **Connexion automatique** au serveur audio au chargement de la page
2. **Clic sur micro** → Demande accès microphone
3. **Streaming démarré** → Audio envoyé en temps réel vers le serveur
4. **Clic sur micro rouge** → Arrêt du streaming

### Code Technique
```typescript
// Configuration automatique HTTP/HTTPS
const getAudioServerUrl = () => {
  const isHttps = window.location.protocol === 'https:';
  const hostname = window.location.hostname;
  return isHttps ? `https://${hostname}:8443` : `http://${hostname}:8080`;
};

// Utilisation du hook
const audioStreaming = useAudioStreaming({
  serverUrl: getAudioServerUrl(),
  userId: user?.id || '',
  userRole: 'commercial',
  userInfo: { name: user?.nom || '', equipe: 'Équipe Commercial' }
});
```

---

## 👨‍💼 Côté Admin

### Interface
- **Sidebar gauche** avec liste des commerciaux
- **Bouton écouteurs** 🎧 à côté de chaque commercial
- **Panneau de contrôle audio** en bas à droite quand écoute active
- **Barre de volume** bleue avec contrôles

### Fonctionnement
1. **Connexion automatique** au serveur audio
2. **Clic sur écouteurs** → Demande d'écoute pour ce commercial
3. **Panneau apparaît** → Contrôle du volume et indicateurs
4. **Audio reçu** → Lecture automatique dans le navigateur

### Multi-Écoute
- **Plusieurs admins** peuvent écouter le même commercial
- **Un seul commercial** par admin à la fois
- **Compteur de listeners** affiché côté serveur

---

## 🐍 Serveur Python WebRTC

### Rôle Principal
Le serveur agit comme un **relais audio** entre commerciaux et administrateurs.

### Flux de Données

#### 1. Commercial Démarre le Streaming
```python
@sio.on('start_streaming')
async def on_start_streaming(sid, data):
    # Enregistre le commercial comme streameur actif
    commercial_id = data.get('commercial_id')
    # Notifie les admins qu'un stream est disponible
```

#### 2. Réception de l'Audio Commercial
```python
@sio.on('webrtc_offer') 
async def on_webrtc_offer(sid, data):
    # Crée une connexion WebRTC avec le commercial
    pc = RTCPeerConnection()
    
    @pc.on("track")
    def on_track(track):
        # Stocke la piste audio pour ce commercial
        self.commercial_audio_tracks[commercial_id] = track
        # Notifie tous les admins qui écoutent
```

#### 3. Admin Demande d'Écouter
```python
@sio.on('join_commercial_stream')
async def on_join_commercial_stream(sid, data):
    # Enregistre l'admin comme listener
    # Si audio déjà disponible → configure connexion WebRTC immédiatement
    if commercial_id in self.commercial_audio_tracks:
        await self.setup_admin_webrtc_connection(sid, commercial_id)
```

#### 4. Relais Audio vers Admin
```python
async def setup_admin_webrtc_connection(admin_sid, commercial_id):
    # Récupère la piste audio du commercial
    audio_track = self.commercial_audio_tracks[commercial_id]
    
    # Crée connexion WebRTC pour l'admin
    pc = RTCPeerConnection()
    relayed_track = self.media_relay.subscribe(audio_track)
    pc.addTrack(relayed_track)
    
    # Envoie l'offre WebRTC à l'admin
    offer = await pc.createOffer()
    await self.sio.emit('webrtc_offer_from_commercial', {
        'commercial_id': commercial_id,
        'sdp': {'sdp': pc.localDescription.sdp, 'type': pc.localDescription.type}
    }, room=admin_sid)
```

### Gestion des États
```python
# Stockage des connexions
self.commercial_connections: Dict[str, RTCPeerConnection] = {}
self.admin_listeners: Dict[str, Set[str]] = {}  # commercial_id -> admin_session_ids
self.commercial_audio_tracks: Dict[str, MediaStreamTrack] = {}
self.admin_connections: Dict[str, RTCPeerConnection] = {}
```

---

## 🔧 Configuration Technique

### Dépendances Python
Installées via `backend/python-server/requirements.txt`:
```bash
cd backend/python-server
pip3 install -r requirements.txt
```
```txt
aiohttp
python-socketio
aiortc
aiofiles
cryptography
python-dotenv
```

### Certificats SSL
- **Localisation:** `backend/ssl/server.cert` et `backend/ssl/server.key`
- **Usage:** HTTPS sur port 8443
- **Fallback:** HTTP sur port 8080

### Protocoles Réseau
- **WebRTC:** Transport audio P2P haute qualité
- **Socket.IO:** Signalisation et coordination
- **STUN:** `stun.l.google.com:19302` pour traversée NAT

---

## 🐛 Débogage

### Logs Commerciaux à Surveiller
```
🎤 COMMERCIAL PAGE - Configuration audio streaming
🎤 COMMERCIAL PAGE - handleToggleStreaming appelé!
🎤 COMMERCIAL - startStreaming appelé!
🎤 COMMERCIAL - Microphone accessible
📡 COMMERCIAL - Notification du début de streaming
```

### Logs Admin à Surveiller
```
🎧 ADMIN - Démarrage écoute pour commercial ID
🎧 Écoute démarrée: {commercial_id, listeners_count}
📞 ADMIN - Offre WebRTC reçue du commercial
🎵 ADMIN - Piste audio reçue
✅ ADMIN - AUDIO EN COURS DE LECTURE! 🔊
```

### Logs Serveur Python
```
INFO:__main__:🎤 Traitement de l'offre WebRTC du commercial
INFO:__main__:🎵 Piste audio reçue du commercial
INFO:__main__:🔊 Audio disponible pour le commercial, notification de X admin(s)
INFO:__main__:🎧 Offre WebRTC envoyée à l'admin
```

### Problèmes Courants

#### 1. Pas d'Audio Reçu
- ✅ Vérifier que le serveur Python tourne
- ✅ Vérifier les certificats SSL (Safari)
- ✅ Commercial doit démarrer le streaming AVANT que l'admin écoute

#### 2. Erreurs de Connexion
- ✅ Vérifier les ports 8080/8443 accessibles
- ✅ CORS configuré pour le domaine utilisé
- ✅ Permissions microphone accordées

#### 3. Qualité Audio
- ✅ Configuration WebRTC: Opus 48kHz, réduction bruit activée
- ✅ MediaRelay optimise le streaming multi-listeners

---

## 🔒 Sécurité

### Authentification
- Utilise le système d'auth existant (JWT)
- User ID vérifié côté serveur

### Confidentialité
- **Transport chiffré** (HTTPS/WSS)
- **Audio P2P** via WebRTC (chiffrement DTLS)
- **Pas de stockage** des conversations

### Permissions
- **Microphone requis** côté commercial
- **Auto-play autorisé** côté admin navigateur

---

## 📊 Monitoring

### Métriques Disponibles
- **Endpoint:** `GET /api/streaming/status`
- **Données:**
  - Nombre de commerciaux actifs
  - Nombre total de listeners
  - Détails par commercial

### Health Check
- **Endpoint:** `GET /health`
- **Réponse:** `{"status": "ok"}`

---

## 🚀 Utilisation en Production

### Optimisations Recommandées
1. **Load Balancer** pour le serveur Python
2. **CDN** pour les assets frontend
3. **Monitoring** des connexions WebRTC
4. **Logs structurés** avec rotation

### Scalabilité
- **Horizontal:** Plusieurs instances du serveur Python
- **Vertical:** MediaRelay optimise la mémoire
- **Limite:** ~100 connexions simultanées par serveur

---

## 📞 Support

En cas de problème:
1. **Vérifier les logs** dans la console navigateur
2. **Consulter les logs serveur** Python
3. **Tester la connectivité** aux endpoints
4. **Vérifier les certificats SSL**

Le système est conçu pour être robuste et auto-récupérant en cas de déconnexions temporaires.