import { INestApplication } from '@nestjs/common';
import * as cors from 'cors';

export class CorsConfig {
  static apply(app: INestApplication): void {
    app.use(
      cors({
        origin: '*',
        allowedHeaders: '*',
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
      }),
    );
  }
}
