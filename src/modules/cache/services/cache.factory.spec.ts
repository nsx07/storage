import { Test, TestingModule } from '@nestjs/testing';
import { CacheFactory } from './cache.factory';
import { ConfigService } from '@nestjs/config';
import { RedisCacheProvider } from '../providers/redis.provider';
import { MemoryCacheProvider } from '../providers/memory.provider';

describe('CacheFactory', () => {
  let factory: CacheFactory;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheFactory,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    factory = module.get<CacheFactory>(CacheFactory);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createProvider', () => {
    it('should create Redis provider by default', () => {
      const provider = factory.createProvider();

      expect(provider).toBeInstanceOf(RedisCacheProvider);
    });

    it('should create Redis provider when type is redis', () => {
      const provider = factory.createProvider('redis');

      expect(provider).toBeInstanceOf(RedisCacheProvider);
    });

    it('should create Memory provider when type is memory', () => {
      const provider = factory.createProvider('memory');

      expect(provider).toBeInstanceOf(MemoryCacheProvider);
    });

    it('should throw error for unsupported cache type', () => {
      expect(() => factory.createProvider('unsupported')).toThrow(
        'Cache type not supported',
      );
    });
  });
});
