import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { CacheProvider } from '../interfaces/cache.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisCacheProvider implements CacheProvider {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async connect(options?: any): Promise<void> {
    const redisUrl = options?.url || this.configService.get('REDIS_URL');

    this.client = createClient({
      url: redisUrl,
      legacyMode: false,
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  async get(key: string, object: boolean = true): Promise<any> {
    const data = object
      ? await this.client.hGetAll(key)
      : await this.client.get(key);

    return object ? data : data;
  }

  async set(key: string, value: any): Promise<void> {
    if (typeof value === 'object') {
      await this.client.hSet(key, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }
}
