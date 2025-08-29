import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cors from 'cors';
import * as express from 'express';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  app.use(
    cors({
      origin: '*',
      allowedHeaders: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use('/wwwroot', express.static('wwwroot'));
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Storage API')
    .setDescription('API for file storage operations')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'token', // The name of the header or query parameter
        in: 'header', // Where the API key is expected (header, query, cookie)
        description: 'Enter your API key',
      },
      'StorageApiKey',
    ) // A unique name for this security scheme
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.PORT || 3030;
  await app.listen(port);
}
bootstrap();
