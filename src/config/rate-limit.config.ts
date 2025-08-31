import { INestApplication } from '@nestjs/common';
import { rateLimit } from 'express-rate-limit';
import { Request } from 'express';

export class RateLimitConfig {
  /**
   * Extract client IP from Railway proxy headers
   */
  private static getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const xRealIp = req.headers['x-real-ip'];
    const remoteAddress =
      req.connection?.remoteAddress || req.socket?.remoteAddress;

    let clientIp = 'unknown';

    if (typeof xForwardedFor === 'string') {
      clientIp = xForwardedFor.split(',')[0].trim();
    } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
      clientIp = xForwardedFor[0].trim();
    } else if (typeof xRealIp === 'string') {
      clientIp = xRealIp;
    } else if (remoteAddress) {
      clientIp = remoteAddress;
    }

    return clientIp;
  }

  static apply(app: INestApplication): void {
    app.use(
      '/api/',
      rateLimit({
        windowMs: 5 * 60 * 1000,
        max: 1000,
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        keyGenerator: (req) => this.getClientIp(req),
      }),
    );

    app.use(
      '/wwwroot/',
      rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 500,
        keyGenerator: (req) => this.getClientIp(req),
        skip: (req) => {
          return !!(
            req.headers['if-none-match'] || req.headers['if-modified-since']
          );
        },
      }),
    );
  }
}
