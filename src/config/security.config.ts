import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export class SecurityConfig {
  static apply(app: INestApplication): void {
    app.getHttpAdapter().getInstance().set('trust proxy', false);

    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false,
      }),
    );
  }
}
