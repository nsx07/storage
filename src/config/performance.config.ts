/**
 * Performance Configuration for Static File Delivery
 *
 * This configuration optimizes static file serving with:
 * - Intelligent caching strategies
 * - Compression optimization
 * - Rate limiting
 * - Security headers
 * - Range request support
 */

export const CACHE_CONFIG = {
  // Cache durations by file type (in seconds)
  IMAGES: 2592000, // 30 days for images (jpg, png, gif, etc.)
  STYLES_SCRIPTS: 604800, // 7 days for CSS/JS files
  DOCUMENTS: 3600, // 1 hour for documents (pdf, doc, etc.)
  ARCHIVES: 86400, // 1 day for archives (zip, tar, etc.)
  DEFAULT: 300, // 5 minutes for other files
};

export const COMPRESSION_CONFIG = {
  level: 6, // Optimal compression level (1-9)
  threshold: 1024, // Only compress files > 1KB

  // File types that should not be compressed (already compressed)
  skipExtensions: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'zip',
    'gz',
    'rar',
    'mp4',
    'mov',
  ],
};

export const RATE_LIMIT_CONFIG = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
  },
  staticFiles: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // 500 requests per window
  },
};

export const SECURITY_CONFIG = {
  // Content Security Policy settings
  csp: {
    directives: {
      'default-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
    },
  },

  // Cross-origin settings
  cors: {
    origin: '*',
    credentials: false,
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  },
};

export const PERFORMANCE_HEADERS = {
  // Standard caching headers
  'Cache-Control': 'public, max-age=3600',
  ETag: true,
  'Last-Modified': true,

  // Compression headers
  Vary: 'Accept-Encoding',

  // Security headers
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',

  // Performance headers
  'Accept-Ranges': 'bytes',
  Connection: 'keep-alive',
};

/**
 * Get cache duration based on file extension
 */
export function getCacheDuration(filePath: string): number {
  const ext = filePath.split('.').pop()?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'webp'].includes(ext || '')) {
    return CACHE_CONFIG.IMAGES;
  }

  if (['css', 'js'].includes(ext || '')) {
    return CACHE_CONFIG.STYLES_SCRIPTS;
  }

  if (['zip', 'tar', 'gz', 'rar'].includes(ext || '')) {
    return CACHE_CONFIG.ARCHIVES;
  }

  if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
    return CACHE_CONFIG.DOCUMENTS;
  }

  return CACHE_CONFIG.DEFAULT;
}

/**
 * Check if file should be compressed based on extension and size
 */
export function shouldCompress(filePath: string, fileSize: number): boolean {
  if (fileSize < COMPRESSION_CONFIG.threshold) {
    return false;
  }

  const ext = filePath.split('.').pop()?.toLowerCase();
  return !COMPRESSION_CONFIG.skipExtensions.includes(ext || '');
}
