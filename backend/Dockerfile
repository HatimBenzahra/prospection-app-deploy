# Backend NestJS Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Générer Prisma client
RUN npx prisma generate

# Copier le code source
COPY . .

# Build l'application
RUN npm run build

# Exposer le port que Render assigne dynamiquement
EXPOSE $PORT

# Variables d'environnement pour Render
ENV NODE_ENV=production

# Commande de démarrage
CMD ["npm", "run", "start:prod"]