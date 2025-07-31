#!/bin/bash

echo "🚀 Déploiement automatique sur Render"
echo "======================================"

# Vérifier si git est configuré
if [ -z "$(git config user.email)" ]; then
    echo "⚠️ Configuration Git requise. Exécutez:"
    echo "git config --global user.email 'votre@email.com'"
    echo "git config --global user.name 'Votre Nom'"
    exit 1
fi

# Initialiser le dépôt git si nécessaire
if [ ! -d ".git" ]; then
    echo "🔧 Initialisation du dépôt Git..."
    git init
    git branch -M main
fi

# Ajouter tous les fichiers
echo "📁 Ajout des fichiers au dépôt..."
git add .
git commit -m "Setup for Render deployment" || echo "Aucun changement à commiter"

# Créer un dépôt GitHub
echo "📤 Instructions pour le déploiement:"
echo ""
echo "1. Créez un dépôt GitHub pour votre projet"
echo "2. Ajoutez le remote GitHub:"
echo "   git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git"
echo "3. Poussez le code:"
echo "   git push -u origin main"
echo ""
echo "4. Allez sur https://render.com"
echo "5. Connectez-vous avec GitHub"
echo "6. Cliquez sur 'New +' > 'Blueprint'"
echo "7. Connectez votre dépôt GitHub"
echo "8. Render détectera automatiquement le fichier render.yaml"
echo "9. Cliquez sur 'Apply' pour déployer"
echo ""
echo "🎉 Votre application sera déployée automatiquement!"
echo "📱 Vous recevrez les URLs de vos services dans le dashboard Render"
echo ""
echo "🔧 Les services déployés seront:"
echo "   - prospection-backend (API NestJS)"
echo "   - prospection-python-server (Serveur audio)"
echo "   - prospection-frontend (Interface React)"
echo "   - prospection-db (Base de données PostgreSQL)"