import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export class SwaggerConfig {
  static setup(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle('Storage API')
      .setDescription('API for file storage operations')
      .setVersion('1.0')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'token',
          in: 'header',
          description: 'Enter your API key',
        },
        'StorageApiKey',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }
}
