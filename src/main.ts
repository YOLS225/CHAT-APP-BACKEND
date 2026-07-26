import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
