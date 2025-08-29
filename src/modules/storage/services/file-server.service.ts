import { Injectable, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, statSync, existsSync } from 'fs';
import { join } from 'path';
import * as mime from 'mime-types';

@Injectable()
export class FileServerService {
  private readonly wwwroot = join(process.cwd(), 'wwwroot');

  /**
   * Serve file with Range support for better streaming
   */
  async serveFile(filePath: string, res: Response): Promise<StreamableFile> {
    const fullPath = join(this.wwwroot, filePath);

    if (!existsSync(fullPath)) {
      throw new Error('File not found');
    }

    const stats = statSync(fullPath);
    const fileSize = stats.size;
    const range = res.req.headers.range;

    // Set content type
    const contentType = mime.lookup(fullPath) || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Enable caching
    res.setHeader('Cache-Control', this.getCacheControl(filePath));
    res.setHeader('ETag', `"${stats.mtime.getTime()}-${fileSize}"`);
    res.setHeader('Last-Modified', stats.mtime.toUTCString());

    // Handle range requests for better streaming
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize.toString());

      const stream = createReadStream(fullPath, { start, end });
      return new StreamableFile(stream);
    } else {
      res.setHeader('Content-Length', fileSize.toString());
      res.setHeader('Accept-Ranges', 'bytes');

      const stream = createReadStream(fullPath);
      return new StreamableFile(stream);
    }
  }

  /**
   * Get optimized cache control headers based on file type
   */
  private getCacheControl(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'ico':
      case 'svg':
      case 'webp':
        return 'public, max-age=2592000, immutable'; // 30 days for images

      case 'css':
      case 'js':
        return 'public, max-age=604800'; // 7 days for CSS/JS

      case 'zip':
      case 'tar':
      case 'gz':
      case 'rar':
        return 'public, max-age=86400'; // 1 day for archives

      case 'pdf':
      case 'doc':
      case 'docx':
        return 'public, max-age=3600'; // 1 hour for documents

      default:
        return 'public, max-age=300'; // 5 minutes for other files
    }
  }

  /**
   * Pre-compress files for better performance
   */
  async shouldCompress(filePath: string): Promise<boolean> {
    const stats = statSync(join(this.wwwroot, filePath));
    const size = stats.size;
    const ext = filePath.split('.').pop()?.toLowerCase();

    // Don't compress already compressed formats
    const compressedFormats = ['jpg', 'jpeg', 'png', 'gif', 'zip', 'gz', 'rar'];
    if (compressedFormats.includes(ext || '')) {
      return false;
    }

    // Only compress files larger than 1KB
    return size > 1024;
  }
}
