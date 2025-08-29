import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { CacheFactory } from './cache.factory';
import { ConfigService } from '@nestjs/config';
import { CacheProvider } from '../interfaces/cache.interface';

describe('CacheService', () => {
  let service: CacheService;
  let cacheFactory: jest.Mocked<CacheFactory>;
  let configService: jest.Mocked<ConfigService>;
  let mockProvider: jest.Mocked<CacheProvider>;

  const mockCacheFactory = {
    createProvider: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockCacheProvider = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CacheFactory,
          useValue: mockCacheFactory,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheFactory = module.get(CacheFactory);
    configService = module.get(ConfigService);
    mockProvider = mockCacheProvider as jest.Mocked<CacheProvider>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize with redis cache provider by default', async () => {
      configService.get.mockReturnValue(undefined);
      cacheFactory.createProvider.mockReturnValue(mockProvider);
      mockProvider.connect.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(configService.get).toHaveBeenCalledWith('CACHE_TYPE');
      expect(cacheFactory.createProvider).toHaveBeenCalledWith('redis');
      expect(mockProvider.connect).toHaveBeenCalled();
    });

    it('should initialize with specified cache provider', async () => {
      configService.get.mockReturnValue('memory');
      cacheFactory.createProvider.mockReturnValue(mockProvider);
      mockProvider.connect.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(cacheFactory.createProvider).toHaveBeenCalledWith('memory');
      expect(mockProvider.connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      configService.get.mockReturnValue('redis');
      cacheFactory.createProvider.mockReturnValue(mockProvider);
      mockProvider.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from cache provider', async () => {
      // First initialize the service
      configService.get.mockReturnValue('redis');
      cacheFactory.createProvider.mockReturnValue(mockProvider);
      mockProvider.connect.mockResolvedValue(undefined);
      mockProvider.disconnect.mockResolvedValue(undefined);

      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockProvider.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect errors', async () => {
      configService.get.mockReturnValue('redis');
      cacheFactory.createProvider.mockReturnValue(mockProvider);
      mockProvider.connect.mockResolvedValue(undefined);
      mockProvider.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      await service.onModuleInit();
      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Disconnect failed',
      );
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      configService.get.mockReturnValue('redis');
      cacheFactory.createProvider.mockReturnValue(mockProvider);
      mockProvider.connect.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it('should get value from cache with object parsing enabled by default', async () => {
      const mockData = { key: 'value' };
      mockProvider.get.mockResolvedValue(mockData);

      const result = await service.get('test-key');

      expect(mockProvider.get).toHaveBeenCalledWith('test-key', true);
      expect(result).toBe(mockData);
    });

    it('should get value from cache with object parsing disabled', async () => {
      const mockData = 'string-value';
      mockProvider.get.mockResolvedValue(mockData);

      const result = await service.get('test-key', false);

      expect(mockProvider.get).toHaveBeenCalledWith('test-key', false);
      expect(result).toBe(mockData);
    });

    it('should handle cache provider errors', async () => {
      mockProvider.get.mockRejectedValue(new Error('Cache error'));

      await expect(service.get('test-key')).rejects.toThrow('Cache error');
    });
  });

  describe('set', () => {
    beforeEach(async () => {
      configService.get.mockReturnValue('redis');
      cacheFactory.createProvider.mockReturnValue(mockProvider);
      mockProvider.connect.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it('should set value in cache', async () => {
      const testValue = { key: 'value' };
      mockProvider.set.mockResolvedValue(undefined);

      await service.set('test-key', testValue);

      expect(mockProvider.set).toHaveBeenCalledWith('test-key', testValue);
    });

    it('should handle cache provider errors', async () => {
      mockProvider.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.set('test-key', 'value')).rejects.toThrow(
        'Cache error',
      );
    });
  });

  describe('del', () => {
    beforeEach(async () => {
      configService.get.mockReturnValue('redis');
      cacheFactory.createProvider.mockReturnValue(mockProvider);
      mockProvider.connect.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it('should delete value from cache', async () => {
      mockProvider.del.mockResolvedValue(undefined);

      await service.del('test-key');

      expect(mockProvider.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle cache provider errors', async () => {
      mockProvider.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.del('test-key')).rejects.toThrow('Cache error');
    });
  });

  describe('keys', () => {
    beforeEach(async () => {
      configService.get.mockReturnValue('redis');
      cacheFactory.createProvider.mockReturnValue(mockProvider);
      mockProvider.connect.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it('should get keys from cache with pattern', async () => {
      const mockKeys = ['key1', 'key2', 'key3'];
      mockProvider.keys.mockResolvedValue(mockKeys);

      const result = await service.keys('test:*');

      expect(mockProvider.keys).toHaveBeenCalledWith('test:*');
      expect(result).toBe(mockKeys);
    });

    it('should handle cache provider errors', async () => {
      mockProvider.keys.mockRejectedValue(new Error('Cache error'));

      await expect(service.keys('test:*')).rejects.toThrow('Cache error');
    });
  });
});
