// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- 1. Importer
import path from "path" // <-- Shadcn en aura besoin plus tard, autant l'ajouter
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- 2. Ajouter le plugin
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // <-- Shadcn va l'ajouter, on peut anticiper
    },
  },
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../backend/ssl/192.168.1.50-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../backend/ssl/192.168.1.50.pem')),
    },
    host: '192.168.1.50',
    port: 5173,
  },
})