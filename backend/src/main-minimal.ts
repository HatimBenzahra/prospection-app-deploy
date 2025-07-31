import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

// Module minimal sans base de données
import { Module, Controller, Get } from '@nestjs/common';

@Controller()
class MinimalController {
  @Get()
  getRoot() {
    return {
      message: 'Prospection Backend API',
      status: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0-minimal'
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'prospection-backend-minimal',
      version: '1.0.0'
    };
  }

  @Get('api/commerciaux')
  getCommerciaux() {
    return [
      { id: '1', nom: 'Dupont', prenom: 'Jean', email: 'jean@test.com' },
      { id: '2', nom: 'Martin', prenom: 'Marie', email: 'marie@test.com' }
    ];
  }
}

@Module({
  controllers: [MinimalController],
})
class MinimalAppModule {}

async function bootstrap() {
  console.log('🚀 Starting MINIMAL backend (no database)...');
  
  try {
    const app = await NestFactory.create(MinimalAppModule, {
      logger: ['error', 'warn', 'log'],
    });

    app.useGlobalPipes(new ValidationPipe());
    
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Minimal backend running on port ${port}`);
    console.log(`📊 Health: http://localhost:${port}/health`);
    console.log(`🧪 API: http://localhost:${port}/api/commerciaux`);
  } catch (error) {
    console.error('❌ Minimal backend failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

bootstrap();