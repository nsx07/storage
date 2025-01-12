export interface CacheProvider {
  get(key: string, object?: boolean): Promise<any>;
  set(key: string, value: any): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  connect(options?: any): Promise<void>;
  disconnect(): Promise<void>;
}

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
}
