import { FileStatus } from '../src/modules/storage/interfaces/file.interface';

export class TestResponseFile {
  constructor(
    public status: FileStatus,
    public data?: any,
    public error?: Error | null,
  ) {}

  static success(data?: any) {
    return new TestResponseFile(FileStatus.SUCCESS, data);
  }

  static notFound() {
    return new TestResponseFile(FileStatus.NOT_FOUND);
  }

  static error(error: Error) {
    return new TestResponseFile(FileStatus.ERROR, null, error);
  }
}

export const mockStorageService = {
  createDirectory: jest.fn(),
  deleteDirectory: jest.fn(),
  rename: jest.fn(),
  zipDirectory: jest.fn(),
  readFile: jest.fn(),
  fileExists: jest.fn(),
  log: jest.fn(),
  listFromPath: jest.fn(),
};

export const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
};

export const createMockBackupService = () => ({
  init: jest.fn(),
  createBackup: jest.fn(),
  restoreBackup: jest.fn(),
  listBackups: jest.fn(),
  deleteBackup: jest.fn(),
  scheduleBackup: jest.fn(),
  cancelScheduledBackup: jest.fn(),
  getBackupStatus: jest.fn(),
  log: jest.fn(),
});

export const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

export function createMockResponse(
  status: FileStatus,
  data?: any,
  error?: Error,
) {
  return {
    status,
    data,
    error,
  };
}

export function createMockBackupResponse(
  status: 'success' | 'failed',
  message: string,
  error?: string,
) {
  return {
    status,
    message,
    ...(error && { error }),
  };
}
