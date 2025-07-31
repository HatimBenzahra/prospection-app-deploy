# Python Server Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système nécessaires pour audio
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 8000

# Commande de démarrage
CMD ["python", "audio_streaming_server.py"]