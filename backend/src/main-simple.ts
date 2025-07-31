import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Starting SIMPLE backend without DB...');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Simple backend running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
  } catch (error) {
    console.error('❌ Backend startup failed:', error);
    process.exit(1);
  }
}

bootstrap();