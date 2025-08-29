import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    const userAgent = req.get('User-Agent') || '';

    // Add request ID for tracking
    const requestId = Math.random().toString(36).substring(7);
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Track response time
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('Content-Length');

      // Log performance metrics for static files
      if (originalUrl.startsWith('/wwwroot') || originalUrl.startsWith('/api/stream')) {
        this.logFileServing({
          requestId,
          method,
          url: originalUrl,
          statusCode,
          duration,
          contentLength,
          userAgent: userAgent.substring(0, 100), // Truncate user agent
          cached: this.isCachedResponse(req, res),
        });
      }

      // Log slow requests (> 1 second)
      if (duration > 1000) {
        this.logger.warn(`Slow request detected: ${method} ${originalUrl} - ${duration}ms`);
      }
    });

    next();
  }

  private logFileServing(data: {
    requestId: string;
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    contentLength?: string;
    userAgent: string;
    cached: boolean;
  }): void {
    const { requestId, method, url, statusCode, duration, contentLength, cached } = data;
    
    const size = contentLength ? `${Math.round(parseInt(contentLength) / 1024)}KB` : 'unknown';
    const cacheStatus = cached ? 'HIT' : 'MISS';
    
    this.logger.log(
      `[${requestId}] ${method} ${url} - ${statusCode} - ${duration}ms - ${size} - Cache: ${cacheStatus}`
    );
  }

  private isCachedResponse(req: Request, res: Response): boolean {
    // Check if response was served from cache
    return res.statusCode === 304 || 
           !!(req.headers['if-none-match'] && res.get('ETag')) ||
           !!(req.headers['if-modified-since'] && res.get('Last-Modified'));
  }
}
