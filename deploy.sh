#!/bin/bash

echo "🚀 Script de déploiement automatique sur Railway"

# Vérifier si Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "📦 Installation de Railway CLI..."
    npm install -g @railway/cli
fi

# Se connecter à Railway (ouvrira le navigateur)
echo "🔑 Connexion à Railway..."
railway login

# Créer un nouveau projet
echo "📋 Création du projet Railway..."
railway init

# Déployer la base de données PostgreSQL
echo "🗄️ Déploiement de la base de données PostgreSQL..."
railway add --service postgresql

# Attendre que la base de données soit prête
echo "⏳ Attente de la mise en route de la base de données..."
sleep 30

# Obtenir l'URL de la base de données
DB_URL=$(railway variables get DATABASE_URL)
echo "✅ Base de données créée: $DB_URL"

# Créer les services pour chaque partie de l'application
echo "🏗️ Création des services..."

# Service Backend
echo "📤 Déploiement du backend..."
cd backend
railway init --name="prospection-backend"
railway up
cd ..

# Service Python Server
echo "🐍 Déploiement du serveur Python..."
cd backend/python-server
railway init --name="prospection-python-server"
railway up
cd ../..

# Service Frontend
echo "🎨 Déploiement du frontend..."
cd moduleProspec-1dc4f634c6c14f0913f8052d2523c56f04d7738b
railway init --name="prospection-frontend"
railway up
cd ..

echo "🎉 Déploiement terminé!"
echo "📋 Vos services sont maintenant en ligne:"
echo "   - Backend: https://prospection-backend.railway.app"
echo "   - Python Server: https://prospection-python-server.railway.app"
echo "   - Frontend: https://prospection-frontend.railway.app"
echo ""
echo "🔧 Configurez les variables d'environnement dans le dashboard Railway:"
echo "   - DATABASE_URL (déjà configuré automatiquement)"
echo "   - NODE_ENV=production"