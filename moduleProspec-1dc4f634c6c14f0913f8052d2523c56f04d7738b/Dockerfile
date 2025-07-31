# Frontend React Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build l'application
RUN npm run build

# Étape de production avec nginx
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=0 /app/dist /usr/share/nginx/html

# Créer une configuration nginx simple
RUN echo 'server { \
    listen $PORT; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
        root /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf.template

# Script pour remplacer le port au démarrage
RUN echo '#!/bin/sh \
envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf \
exec nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

# Exposer le port dynamique de Render
EXPOSE $PORT

CMD ["/start.sh"]