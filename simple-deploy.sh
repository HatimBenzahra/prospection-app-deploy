#!/bin/bash

echo "🚀 Déploiement super simple sur Railway"
echo "Ce script va configurer votre projet pour un déploiement automatique"

# Vérifier si Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "📦 Installation de Railway CLI..."
    npm install -g @railway/cli
fi

# Vérifier si git est configuré
echo "📋 Vérification de la configuration Git..."
if [ -z "$(git config user.email)" ]; then
    echo "⚠️ Veuillez configurer votre email Git:"
    echo "git config --global user.email 'votre@email.com'"
    exit 1
fi

# Initialiser le dépôt git si nécessaire
if [ ! -d ".git" ]; then
    echo "🔧 Initialisation du dépôt Git..."
    git init
    git add .
    git commit -m "Initial commit for Railway deployment"
fi

# Se connecter à Railway
echo "🔑 Connexion à Railway (une page web va s'ouvrir)..."
railway login

# Créer et déployer le projet
echo "🚀 Création du projet Railway..."
railway init

# Ajouter PostgreSQL
echo "🗄️ Ajout de PostgreSQL..."
railway add postgresql

echo ""
echo "🎉 Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Allez sur https://railway.app/project"
echo "2. Connectez votre dépôt GitHub au projet"
echo "3. Railway déploiera automatiquement votre application"
echo ""
echo "🔧 Variables d'environnement à configurer dans Railway:"
echo "   - DATABASE_URL (automatiquement configuré)"
echo "   - NODE_ENV=production"
echo ""
echo "🌐 Votre application sera accessible via l'URL fournie par Railway"