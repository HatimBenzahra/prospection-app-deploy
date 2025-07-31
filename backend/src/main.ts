import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  console.log('🚀 Starting NestJS backend...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
  
  try {
    // En production (Render), utiliser HTTP simple car Render gère HTTPS
    if (process.env.NODE_ENV === 'production') {
      const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
      });
      
      app.useGlobalPipes(new ValidationPipe());
      
          app.enableCors({
      origin: [
        'https://prospection-frontend.onrender.com',
        'http://prospection-frontend.onrender.com',
        'https://localhost:5173',
        'http://localhost:5173',
        'https://127.0.0.1:5173',
        'http://127.0.0.1:5173'
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
      
      const port = process.env.PORT || process.env.API_PORT || 3000;
      await app.listen(port, '0.0.0.0');
      console.log(`✅ Production Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      return;
    }
  } catch (error) {
    console.error('❌ Production startup failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }

  // Code de développement avec SSL
  const sslPath = path.join(process.cwd(), 'ssl');
    
  try {
    // Essayer HTTPS d'abord
    const httpsOptions = {
      key: fs.readFileSync(path.join(sslPath, '127.0.0.1+1-key.pem')),
      cert: fs.readFileSync(path.join(sslPath, '127.0.0.1+1.pem')),
    };

    const app = await NestFactory.create(AppModule, {
      httpsOptions,
    });

    app.useGlobalPipes(new ValidationPipe());

    app.enableCors({
      origin: [
        `https://localhost:5173`, 
        `https://127.0.0.1:5173`,
        `https://${process.env.CLIENT_HOST || '192.168.1.50'}:5173`,
        `http://localhost:5173`, 
        `http://127.0.0.1:5173`,
        `http://${process.env.CLIENT_HOST || '192.168.1.50'}:5173`
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const port = process.env.API_PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 HTTPS Server running on https://localhost:${port}`);
  } catch (error) {
    console.error('HTTPS failed, starting HTTP fallback:', error);
    
    // Fallback HTTP
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe());

    app.enableCors({
      origin: [
        `http://localhost:5173`, 
        `http://127.0.0.1:5173`,
        `http://${process.env.CLIENT_HOST || '192.168.1.50'}:5173`,
        `https://localhost:5173`, 
        `https://127.0.0.1:5173`,
        `https://${process.env.CLIENT_HOST || '192.168.1.50'}:5173`
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const port = process.env.API_PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 HTTP Server running on http://localhost:${port}`);
  }
}
bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
