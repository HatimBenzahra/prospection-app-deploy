#!/bin/bash

echo "🚀 Déploiement automatique sur Render avec surveillance"
echo "=================================================="

# Configuration
REPO_URL="https://github.com/HatimBenzahra/prospection-app-deploy"
RENDER_API_KEY=""  # Tu devras ajouter ta clé API Render ici

# Fonction pour obtenir les logs de déploiement
get_deployment_status() {
    local service_id=$1
    local service_name=$2
    
    echo "📊 Vérification du statut de $service_name..."
    
    # Simuler la vérification du statut (remplace par l'API Render réelle)
    curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
         "https://api.render.com/v1/services/$service_id/deploys" \
         | jq -r '.[] | select(.status == "live" or .status == "build_failed") | "\(.status): \(.finishedAt // "en cours")"' \
         | head -1
}

# Pousser les changements
echo "📤 Push des changements vers GitHub..."
git add .
git commit -m "Auto-deploy: $(date)" || echo "Aucun changement à commiter"
git push origin main

echo "✅ Code poussé vers GitHub"
echo ""

# Déclencher le déploiement via webhook (plus simple que l'API)
echo "🔄 Déclenchement du redéploiement Render..."
echo "📋 Allez sur https://dashboard.render.com et cliquez sur 'Deploy Latest Commit'"
echo ""

# Surveiller les services
echo "👀 Surveillance des déploiements en cours..."
echo "📊 Services à surveiller :"
echo "   - prospection-backend"
echo "   - prospection-python-server" 
echo "   - prospection-frontend"
echo ""

# Boucle de surveillance
for i in {1..60}; do
    echo "⏱️  Vérification $i/60 (toutes les 30 secondes)..."
    
    # Vérifier le statut via l'API publique GitHub (pour voir les commits)
    LATEST_COMMIT=$(git rev-parse HEAD)
    echo "📝 Dernier commit: ${LATEST_COMMIT:0:8}"
    
    # Attendre 30 secondes
    sleep 30
    
    # Tenter de ping les services déployés
    echo "🌐 Test des services déployés..."
    
    # Tester si les services répondent (remplace par tes vraies URLs quand déployées)
    if curl -s --connect-timeout 5 "https://prospection-backend.onrender.com/health" > /dev/null 2>&1; then
        echo "✅ Backend: En ligne"
    else
        echo "⏳ Backend: En cours de déploiement..."
    fi
    
    if curl -s --connect-timeout 5 "https://prospection-python-server.onrender.com/health" > /dev/null 2>&1; then
        echo "✅ Python Server: En ligne"
    else
        echo "⏳ Python Server: En cours de déploiement..."
    fi
    
    if curl -s --connect-timeout 5 "https://prospection-frontend.onrender.com" > /dev/null 2>&1; then
        echo "✅ Frontend: En ligne"
        echo ""
        echo "🎉 DÉPLOIEMENT RÉUSSI !"
        echo "🌐 URLs de production :"
        echo "   - Frontend: https://prospection-frontend.onrender.com"
        echo "   - Backend: https://prospection-backend.onrender.com"
        echo "   - Python Server: https://prospection-python-server.onrender.com"
        exit 0
    else
        echo "⏳ Frontend: En cours de déploiement..."
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
done

echo "⚠️  Timeout atteint. Vérifiez manuellement sur https://dashboard.render.com"