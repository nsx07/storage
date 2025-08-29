import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    configService = module.get(ConfigService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (headers: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as ExecutionContext;

  describe('canActivate', () => {
    it('should return true when BYPASS is enabled', () => {
      configService.get.mockImplementation((key) => {
        if (key === 'BYPASS') return 'true';
        return undefined;
      });

      const context = createMockExecutionContext({});
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('BYPASS');
    });

    it('should return true when valid token is provided', () => {
      const validToken = 'valid-token-123';

      configService.get.mockImplementation((key) => {
        if (key === 'BYPASS') return 'false';
        if (key === 'STORAGE_TOKEN') return validToken;
        return undefined;
      });

      const context = createMockExecutionContext({ token: validToken });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('STORAGE_TOKEN');
    });

    it('should throw UnauthorizedException when invalid token is provided', () => {
      const validToken = 'valid-token-123';
      const invalidToken = 'invalid-token';

      configService.get.mockImplementation((key) => {
        if (key === 'BYPASS') return 'false';
        if (key === 'STORAGE_TOKEN') return validToken;
        return undefined;
      });

      const context = createMockExecutionContext({ token: invalidToken });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid token');
    });

    it('should throw UnauthorizedException when no token is provided', () => {
      const validToken = 'valid-token-123';

      configService.get.mockImplementation((key) => {
        if (key === 'BYPASS') return 'false';
        if (key === 'STORAGE_TOKEN') return validToken;
        return undefined;
      });

      const context = createMockExecutionContext({});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid token');
    });

    it('should handle missing STORAGE_TOKEN configuration', () => {
      configService.get.mockImplementation((key) => {
        if (key === 'BYPASS') return 'false';
        if (key === 'STORAGE_TOKEN') return undefined;
        return undefined;
      });

      const context = createMockExecutionContext({ token: 'any-token' });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should treat non-string bypass values as false', () => {
      const validToken = 'valid-token-123';

      configService.get.mockImplementation((key) => {
        if (key === 'BYPASS') return 'false';
        if (key === 'STORAGE_TOKEN') return validToken;
        return undefined;
      });

      const context = createMockExecutionContext({ token: validToken });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
