import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cors from 'cors';
import * as express from 'express';
import * as compression from 'compression';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { PerformanceMiddleware } from './common/middleware/performance.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  // Configure Express to trust Railway proxy
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  // Performance monitoring middleware
  app.use(new PerformanceMiddleware().use.bind(new PerformanceMiddleware()));

  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin requests for static files
      contentSecurityPolicy: false, // Disable CSP for API
    }),
  );

  // Rate limiting for API endpoints - Railway compatible
  app.use(
    '/api/',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    }),
  );

  // More generous rate limiting for static files - Railway compatible
  app.use(
    '/wwwroot/',
    rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 500, // 500 static file requests per minute
      skip: (req) => {
        // Skip rate limiting for cached files
        return !!(
          req.headers['if-none-match'] || req.headers['if-modified-since']
        );
      },
    }),
  );

  // Enhanced compression with better configuration
  app.use(
    compression({
      level: 6, // Optimal balance between speed and compression
      threshold: 1024, // Only compress files larger than 1KB
      filter: (req, res) => {
        // Don't compress already compressed files
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }),
  );

  app.use(
    cors({
      origin: '*',
      allowedHeaders: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'], // For range requests
    }),
  );

  // Enhanced static file serving with caching and optimizations
  app.use(
    '/wwwroot',
    express.static('wwwroot', {
      maxAge: '1d', // Cache static files for 1 day
      etag: true, // Enable ETag headers
      lastModified: true, // Enable Last-Modified headers
      immutable: false, // Files can change
      setHeaders: (res, path) => {
        // Set cache headers based on file type
        if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/i)) {
          res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days for images
        } else if (path.match(/\.(css|js)$/i)) {
          res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days for CSS/JS
        } else if (path.match(/\.(zip|tar|gz|rar)$/i)) {
          res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for archives
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for other files
        }

        // Add security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
      },
    }),
  );

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
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(
    `📖 Swagger documentation available at: http://localhost:${port}/swagger`,
  );
  logger.log(`📁 Static files available at: http://localhost:${port}/wwwroot`);
}
bootstrap();
