// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- 1. Importer
import path from "path" // <-- Shadcn en aura besoin plus tard, autant l'ajouter
import fs from 'fs'

export default defineConfig(({ command, mode }) => {
  const config: any = {
    plugins: [
      react(),
      tailwindcss(), // <-- 2. Ajouter le plugin
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // <-- Shadcn va l'ajouter, on peut anticiper
      },
    },
  }

  // Configuration HTTPS uniquement en mode développement et si les certificats existent
  if (command === 'serve' && mode === 'development') {
    const sslKeyPath = path.resolve(__dirname, '../backend/ssl/192.168.1.50-key.pem')
    const sslCertPath = path.resolve(__dirname, '../backend/ssl/192.168.1.50.pem')
    
    if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
      config.server = {
        https: {
          key: fs.readFileSync(sslKeyPath),
          cert: fs.readFileSync(sslCertPath),
        },
        host: '192.168.1.50',
        port: 5173,
      }
    } else {
      console.log('Certificats SSL non trouvés, utilisation HTTP')
      config.server = {
        host: '0.0.0.0',
        port: 5173,
      }
    }
  }

  return config
})