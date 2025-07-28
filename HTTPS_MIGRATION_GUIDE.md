
### 1. Génération des certificats SSL auto-signés

```bash
# Aller dans le dossier backend
cd backend

# Créer le dossier ssl
mkdir ssl
cd ssl

# Générer les certificats avec OpenSSL
openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365 \
  -subj "/C=US/ST=California/L=San Francisco/O=LocalDev/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:192.168.1.1"
```

### 2. Configuration du backend NestJS pour HTTPS

J'ai modifié `backend/src/main.ts` :

```typescript
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const sslPath = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '..', 'ssl')
    : path.join(process.cwd(), 'ssl');
    
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.join(sslPath, 'server.key')),
      cert: fs.readFileSync(path.join(sslPath, 'server.cert')),
    };

    const app = await NestFactory.create(AppModule, {
      httpsOptions,
    });

    app.useGlobalPipes(new ValidationPipe());

    app.enableCors({
      origin: ['https://localhost:5173', 'https://192.168.1.1:5173'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 HTTPS Server running on https://localhost:${port}`);
  } catch (error) {
    console.error('HTTPS failed, starting HTTP fallback:', error);
    
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({
      origin: ['http://localhost:5173', 'http://192.168.1.1:5173'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 HTTP Server running on http://localhost:${port}`);
  }
}
bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
```

### 3. Configuration des WebSockets pour HTTPS

J'ai modifié `backend/src/events/events.gateway.ts` :

```typescript
@WebSocketGateway({
  cors: {
    origin: ['https://localhost:5173', 'https://192.168.1.1:5173'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // reste du code...
}
```

### 4. Configuration du frontend Vite pour HTTPS

J'ai modifié `vite.config.ts` :

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../backend/ssl/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../backend/ssl/server.cert')),
    },
    host: '0.0.0.0',
    port: 5173,
  },
})
```

### 5. Mise à jour de l'URL de l'API

J'ai modifié `src/config.ts` :

```typescript
// Avant
export const API_BASE_URL = `http://${window.location.hostname}:3000`;

// Après
export const API_BASE_URL = `https://${window.location.hostname}:3000`;
```

### 6. Mise à jour des connexions Socket.IO

J'ai cherché tous les fichiers utilisant Socket.IO et les ai modifiés :

```typescript
// Avant
const socket = io('http://localhost:3000');

// Après
const socket = io(`https://${window.location.hostname}:3000`, {
  secure: true,
  transports: ['websocket', 'polling'],
  forceNew: true,
  upgrade: true,
});
```

### 7. Test et démarrage

```bash
# Démarrer le backend
cd backend
npm run start:dev

# Démarrer le frontend (autre terminal)
cd frontend
npm run dev
```

### 8. Acceptation des certificats dans le navigateur

Comme j'utilisais des certificats auto-signés, j'ai dû :

1. Aller sur `https://localhost:3000` dans le navigateur
2. Cliquer sur "Avancé" puis "Continuer vers localhost (non sécurisé)"
3. Faire pareil pour `https://localhost:5173`

## Résultat

- Backend : `https://localhost:3000`
- Frontend : `https://localhost:5173`  
- WebSockets : `wss://localhost:3000`
- Toute la communication est maintenant chiffrée

## Points importants

- Les certificats auto-signés nécessitent une acceptation manuelle dans le navigateur
- Le fallback HTTP évite les pannes si HTTPS échoue
- Les WebSockets passent automatiquement en `wss://` avec HTTPS
- Le CORS doit être mis à jour pour les nouvelles origines HTTPS

## Commandes utiles pendant le debug

```bash
# Vérifier les ports
netstat -an | grep :3000

# Tester HTTPS
curl -k https://localhost:3000

# Tuer un processus sur un port
lsof -ti:3000 | xargs kill -9
```

## Problèmes rencontrés et solutions

### Erreur "Certificate invalid"
Solution : Accepter manuellement les certificats dans le navigateur en visitant les URLs HTTPS.

### WebSockets ne se connectent pas
Solution : S'assurer que les configurations CORS du gateway WebSocket correspondent aux origines HTTPS.

### Erreur de syntaxe avec app.listen()
Solution : Les options HTTPS doivent être passées à `NestFactory.create()`, pas à `listen()`.
