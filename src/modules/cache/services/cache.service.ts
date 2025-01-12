import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { CacheFactory } from './cache.factory';
import { CacheProvider } from '../interfaces/cache.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private provider: CacheProvider;

  constructor(
    private cacheFactory: CacheFactory,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const cacheType = this.configService.get('CACHE_TYPE') || 'redis';
    this.provider = this.cacheFactory.createProvider(cacheType);
    await this.provider.connect({
      url: this.configService.get('REDIS_URL'),
    });
  }

  async onModuleDestroy() {
    await this.provider.disconnect();
  }

  async get(key: string, object: boolean = true): Promise<any> {
    return await this.provider.get(key, object);
  }

  async set(key: string, value: any): Promise<void> {
    await this.provider.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.provider.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.provider.keys(pattern);
  }
}
