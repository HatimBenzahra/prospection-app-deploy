const express = require('express');
const cors = require('cors');

console.log('🚀 Starting Express server...');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
}));

app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'Prospection Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'prospection-backend',
    version: '1.0.0'
  });
});

// Routes API basiques
app.get('/api/commerciaux', (req, res) => {
  res.json([
    { id: '1', nom: 'Dupont', prenom: 'Jean', email: 'jean@test.com' },
    { id: '2', nom: 'Martin', prenom: 'Marie', email: 'marie@test.com' }
  ]);
});

app.get('/api/zones', (req, res) => {
  res.json([
    { id: '1', nom: 'Zone Nord', latitude: 48.8566, longitude: 2.3522 },
    { id: '2', nom: 'Zone Sud', latitude: 43.2965, longitude: 5.3698 }
  ]);
});

// Port
const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Express server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🌐 API: http://localhost:${port}/api/commerciaux`);
});

// Gestion des erreurs
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});