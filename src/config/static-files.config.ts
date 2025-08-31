import { INestApplication } from '@nestjs/common';
import * as express from 'express';

export class StaticFilesConfig {
  static apply(app: INestApplication): void {
    app.use(
      '/wwwroot',
      express.static('wwwroot', {
        maxAge: '1d',
        etag: true,
        lastModified: true,
        immutable: false,
        setHeaders: (res, path) => {
          if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/i)) {
            res.setHeader('Cache-Control', 'public, max-age=2592000');
          } else if (path.match(/\.(css|js)$/i)) {
            res.setHeader('Cache-Control', 'public, max-age=604800');
          } else if (path.match(/\.(zip|tar|gz|rar)$/i)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }

          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
        },
      }),
    );
  }
}
