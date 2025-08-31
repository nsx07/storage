import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(new ValidationPipe());

  // Apply all application configurations
  await AppConfig.configure(app);

  const port = process.env.PORT || 3030;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(
    `📖 Swagger documentation available at: http://localhost:${port}/swagger`,
  );
  logger.log(`📁 Static files available at: http://localhost:${port}/wwwroot`);
}

bootstrap();
