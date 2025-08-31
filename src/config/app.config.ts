import { INestApplication } from '@nestjs/common';
import { SecurityConfig } from './security.config';
import { RateLimitConfig } from './rate-limit.config';
import { CompressionConfig } from './compression.config';
import { CorsConfig } from './cors.config';
import { StaticFilesConfig } from './static-files.config';
import { SwaggerConfig } from './swagger.config';
import { PerformanceMiddleware } from '../common/middleware/performance.middleware';

export class AppConfig {
  static async configure(app: INestApplication): Promise<void> {
    SecurityConfig.apply(app);

    app.use(new PerformanceMiddleware().use.bind(new PerformanceMiddleware()));

    RateLimitConfig.apply(app);

    CompressionConfig.apply(app);

    CorsConfig.apply(app);

    StaticFilesConfig.apply(app);

    SwaggerConfig.setup(app);
  }
}
