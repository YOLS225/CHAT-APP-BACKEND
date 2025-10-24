import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // URL de votre frontend
    credentials: true, // Permet l'envoi de cookies/credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('CHAT-APP BACKEND')
    .setDescription('CHAT-APP BACKEND API')
    .setVersion('1.0')
    .addBearerAuth() // si tu utilises une authentification JWT par exemple
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const PORT = `${process.env.PORT}`;
  SwaggerModule.setup('api', app, document);
  await app.listen(PORT);
  console.log(`lien du swagger : http://localhost:${PORT}/api`);
}
void bootstrap();
