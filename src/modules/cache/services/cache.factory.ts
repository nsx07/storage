import { Injectable } from '@nestjs/common';
import { CacheProvider } from './../interfaces/cache.interface';
import { RedisCacheProvider } from './../providers/redis.provider';
import { MemoryCacheProvider } from './../providers/memory.provider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheFactory {
  constructor(private configService: ConfigService) {}

  createProvider(type: string = 'redis'): CacheProvider {
    switch (type) {
      case 'redis':
        return new RedisCacheProvider(this.configService);
      case 'memory':
        return new MemoryCacheProvider();
      default:
        throw new Error('Cache type not supported');
    }
  }
}
