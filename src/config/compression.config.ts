import { INestApplication } from '@nestjs/common';
import * as compression from 'compression';

export class CompressionConfig {
  static apply(app: INestApplication): void {
    app.use(
      compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
          if (req.headers['x-no-compression']) return false;
          return compression.filter(req, res);
        },
      }),
    );
  }
}
