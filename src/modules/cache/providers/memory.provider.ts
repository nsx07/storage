import { Injectable } from '@nestjs/common';
import { CacheProvider } from '../interfaces/cache.interface';

@Injectable()
export class MemoryCacheProvider implements CacheProvider {
  private cache: Map<string, any> = new Map();

  async connect(): Promise<void> {
    // No connection needed for memory cache
  }

  async disconnect(): Promise<void> {
    this.cache.clear();
  }

  async get(key: string, object: boolean = true): Promise<any> {
    const value = this.cache.get(key);
    if (!value) return null;
    return object ? JSON.parse(value) : value;
  }

  async set(key: string, value: any): Promise<void> {
    this.cache.set(
      key,
      typeof value === 'object' ? JSON.stringify(value) : value,
    );
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter((key) => regex.test(key));
  }
}
