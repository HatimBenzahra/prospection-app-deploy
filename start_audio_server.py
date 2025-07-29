#!/usr/bin/env python3
"""
Script de démarrage pour le serveur de streaming audio
"""

import subprocess
import sys
import os

def check_dependencies():
    """Vérifier que toutes les dépendances sont installées"""
    try:
        import aiohttp
        import socketio
        import aiortc
        print("✅ Toutes les dépendances sont installées")
        return True
    except ImportError as e:
        print(f"❌ Dépendance manquante: {e}")
        print("Veuillez installer les dépendances avec: pip install -r requirements.txt")
        return False

def main():
    """Point d'entrée principal"""
    print("🎵 Démarrage du serveur de streaming audio...")
    print("=" * 50)
    
    if not check_dependencies():
        sys.exit(1)
    
    # Vérifier que le fichier serveur existe
    server_file = os.path.join(os.path.dirname(__file__), 'audio_streaming_server.py')
    if not os.path.exists(server_file):
        print(f"❌ Fichier serveur introuvable: {server_file}")
        sys.exit(1)
    
    print("🚀 Lancement du serveur...")
    print("📡 Le serveur sera accessible sur http://localhost:8080")
    print("🔧 Pour arrêter le serveur, utilisez Ctrl+C")
    print("=" * 50)
    
    try:
        # Lancer le serveur
        subprocess.run([sys.executable, server_file], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Serveur arrêté par l'utilisateur")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du démarrage du serveur: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()