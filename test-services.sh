#!/bin/bash

echo "🧪 SCRIPT DE TEST AUTOMATIQUE DES SERVICES RENDER"
echo "================================================="

# Configuration
FRONTEND_URL="https://prospection-frontend.onrender.com"
BACKEND_URL="https://prospection-backend.onrender.com"
PYTHON_URL="https://prospection-python-server.onrender.com"

# Fonction de test avec curl
test_service() {
    local name=$1
    local url=$2
    local endpoint=${3:-""}
    
    echo ""
    echo "🔍 Test: $name"
    echo "URL: $url$endpoint"
    echo "─────────────────────────────────────"
    
    # Test de base
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url$endpoint")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Status: $HTTP_CODE - SERVICE OK"
        # Récupérer les headers pour plus d'infos
        curl -I "$url$endpoint" 2>/dev/null | head -5
    elif [ "$HTTP_CODE" = "405" ]; then
        echo "⚠️  Status: $HTTP_CODE - Service en ligne mais endpoint non supporté"
    elif [ "$HTTP_CODE" = "502" ]; then
        echo "❌ Status: $HTTP_CODE - SERVICE DOWN (erreur serveur)"
    else
        echo "⚡ Status: $HTTP_CODE - Autre erreur"
    fi
    
    # Test avec timeout plus court
    if timeout 10 curl -s "$url$endpoint" > /dev/null 2>&1; then
        echo "🚀 Connexion: Rapide"
    else
        echo "🐌 Connexion: Lente ou timeout"
    fi
}

# Tests des services
test_service "Frontend" "$FRONTEND_URL"
test_service "Backend Root" "$BACKEND_URL"
test_service "Backend Health" "$BACKEND_URL" "/health"
test_service "Python Server Root" "$PYTHON_URL"
test_service "Python Server Health" "$PYTHON_URL" "/health"

echo ""
echo "📊 RÉSUMÉ"
echo "========="

# Compter les services OK
SERVICES_OK=0

if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
    echo "✅ Frontend: OK"
    ((SERVICES_OK++))
else
    echo "❌ Frontend: KO"
fi

if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" | grep -q "200"; then
    echo "✅ Backend: OK"
    ((SERVICES_OK++))
else
    echo "❌ Backend: KO"
fi

if curl -s -o /dev/null -w "%{http_code}" "$PYTHON_URL/health" | grep -q "200"; then
    echo "✅ Python Server: OK"
    ((SERVICES_OK++))
else
    echo "❌ Python Server: KO"
fi

echo ""
echo "🎯 Services fonctionnels: $SERVICES_OK/3"

if [ $SERVICES_OK -eq 3 ]; then
    echo "🎉 TOUS LES SERVICES SONT EN LIGNE !"
    echo "🌐 Application accessible: $FRONTEND_URL"
else
    echo "⚠️  Certains services nécessitent des corrections"
fi