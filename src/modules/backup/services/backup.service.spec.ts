import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from './backup.service';
import { StorageService } from '../../storage/services/storage.service';
import { CacheService } from '../../cache/services/cache.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { BackupOptions } from '../interfaces/backup.interface';
import {
  FileStatus,
  ResponseFile,
} from '../../storage/interfaces/file.interface';

// Mock the child_process exec function
const mockExecAsync = jest.fn();

// Mock util module
jest.mock('util', () => {
  const actual = jest.requireActual('util');
  return {
    ...actual,
    promisify: jest.fn().mockImplementation((fn) => {
      if (fn.name === 'exec') {
        return mockExecAsync;
      }
      return actual.promisify(fn);
    }),
  };
});

// Mock child_process module
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('BackupService', () => {
  let service: BackupService;
  let storageService: jest.Mocked<StorageService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockStorageService = {
    createDirectory: jest.fn(),
    deleteDirectory: jest.fn(),
    fileExists: jest.fn(),
    log: jest.fn(),
  };

  const mockCacheService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  };

  const mockCronJobsMap = {
    has: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const mockSchedulerRegistry = {
    getCronJobs: jest.fn(() => mockCronJobsMap),
    addCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    storageService = module.get(StorageService);
    cacheService = module.get(CacheService);

    // Reset all mocks
    jest.clearAllMocks();

    // Mock logger to avoid console output in tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  describe('backup', () => {
    const validPayload: BackupOptions = {
      name: 'test-backup',
      folder: 'test-folder',
      connectionString: 'postgresql://user:pass@localhost/testdb',
      continuos: false,
      zip: false,
    };

    it('should create backup successfully without continuous mode', async () => {
      storageService.createDirectory.mockResolvedValue(
        new ResponseFile(FileStatus.SUCCESS, '/backup/test-folder'),
      );

      // Mock successful execAsync
      mockExecAsync.mockResolvedValue({ stdout: 'backup created', stderr: '' });

      const result = await service.backup(validPayload);

      expect(result).toEqual({
        message: 'backup created successfully',
        status: 'success',
      });
      expect(storageService.createDirectory).toHaveBeenCalledWith(
        'backup/test-folder',
      );
    });

    it('should handle backup with continuous mode', async () => {
      const continuousPayload = {
        ...validPayload,
        continuos: true,
        schedule: '0 */6 * * *',
      };

      storageService.createDirectory.mockResolvedValue(
        new ResponseFile(FileStatus.SUCCESS, '/backup/test-folder'),
      );
      mockCronJobsMap.has.mockReturnValue(false);
      cacheService.set.mockResolvedValue(undefined);

      // Mock scheduleBackup to return success
      jest
        .spyOn(service as any, 'scheduleBackup')
        .mockResolvedValue({ error: null });

      const result = await service.backup(continuousPayload);

      expect(result).toEqual({
        message: 'backup created successfully',
        status: 'success',
      });
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should execute existing backup job if not updating', async () => {
      const mockCronJob = { fireOnTick: jest.fn() };

      storageService.createDirectory.mockResolvedValue(
        new ResponseFile(FileStatus.SUCCESS, '/backup/test-folder'),
      );
      mockCronJobsMap.has.mockReturnValue(true);
      mockCronJobsMap.get.mockReturnValue(mockCronJob);

      const result = await service.backup(validPayload);

      expect(result).toEqual({
        message:
          'backup already scheduled, executed right now and on schedule time too.',
        status: 'success',
      });
      expect(mockCronJob.fireOnTick).toHaveBeenCalled();
    });

    it('should update existing backup job when update is true', async () => {
      const updatePayload = {
        ...validPayload,
        continuos: true,
        schedule: '0 */6 * * *',
      };

      mockCronJobsMap.has.mockReturnValue(true);
      mockCronJobsMap.get.mockReturnValue({ fireOnTick: jest.fn() });
      storageService.createDirectory.mockResolvedValue(
        new ResponseFile(FileStatus.SUCCESS, '/backup/test-folder'),
      );
      cacheService.set.mockResolvedValue(undefined);

      jest.spyOn(service, 'removeBackup').mockResolvedValue({
        message: 'backup job removed successfully',
        status: 'success',
      });
      jest
        .spyOn(service as any, 'scheduleBackup')
        .mockResolvedValue({ error: null });

      const result = await service.backup(updatePayload, true);

      expect(result).toEqual({
        message: 'backup created successfully',
        status: 'success',
      });
      expect(service.removeBackup).toHaveBeenCalledWith('test-backup');
    });

    it('should handle missing required fields', async () => {
      const invalidPayload = {
        name: '',
        folder: '',
        connectionString: '',
      } as BackupOptions;

      const result = await service.backup(invalidPayload);

      expect(result).toEqual({
        message: 'failed to create backup',
        status: 'failed',
        error: 'name, folder and connectionString are required',
      });
    });

    it('should handle exec command errors', async () => {
      storageService.createDirectory.mockResolvedValue(
        new ResponseFile(FileStatus.SUCCESS, '/backup/test-folder'),
      );

      // Mock failed execAsync
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const result = await service.backup(validPayload);

      expect(result).toEqual({
        message: 'failed to create backup',
        status: 'failed',
        error: 'Command failed',
      });
    });

    it('should handle schedule backup errors in continuous mode', async () => {
      const continuousPayload = {
        ...validPayload,
        continuos: true,
        schedule: '0 */6 * * *',
      };

      storageService.createDirectory.mockResolvedValue(
        new ResponseFile(FileStatus.SUCCESS, '/backup/test-folder'),
      );
      mockCronJobsMap.has.mockReturnValue(false);

      // Mock scheduleBackup to return error
      jest.spyOn(service as any, 'scheduleBackup').mockResolvedValue({
        error: new Error('Schedule failed'),
      });

      const result = await service.backup(continuousPayload);

      expect(result).toEqual({
        message: 'failed to create backup',
        status: 'failed',
        error: 'Schedule failed',
      });
    });
  });

  describe('restore', () => {
    const restorePayload: BackupOptions = {
      name: 'test-backup',
      folder: 'test-folder',
      connectionString: 'postgresql://user:pass@localhost/testdb',
      continuos: false,
      zip: false,
    };

    it('should restore backup successfully', async () => {
      storageService.fileExists.mockResolvedValue(true);

      // Mock successful execAsync for restore
      mockExecAsync.mockResolvedValue({
        stdout: 'restore completed',
        stderr: '',
      });

      const result = await service.restore(restorePayload);

      expect(result).toEqual({
        message: 'backup restored successfully',
        status: 'success',
      });
    });

    it('should handle non-existent backup file', async () => {
      storageService.fileExists.mockResolvedValue(false);

      const result = await service.restore(restorePayload);

      expect(result).toEqual({
        message: 'failed to restore backup',
        status: 'failed',
        error: 'backup file does not exists',
      });
    });

    it('should handle restore command errors', async () => {
      storageService.fileExists.mockResolvedValue(true);

      // Mock failed execAsync for restore
      mockExecAsync.mockRejectedValue(new Error('Restore failed'));

      const result = await service.restore(restorePayload);

      expect(result).toEqual({
        message: 'failed to restore backup',
        status: 'failed',
        error: 'Restore failed',
      });
    });
  });

  describe('removeBackup', () => {
    it('should remove scheduled backup successfully', async () => {
      mockSchedulerRegistry.deleteCronJob.mockImplementation(() => {});
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.removeBackup('test-backup');

      expect(result).toEqual({
        message: 'backup job removed successfully',
        status: 'success',
      });
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'test-backup',
      );
      expect(cacheService.del).toHaveBeenCalledWith('backup:test-backup');
    });

    it('should handle removal of non-existent backup', async () => {
      mockSchedulerRegistry.deleteCronJob.mockImplementation(() => {
        throw new Error('Job not found');
      });

      const result = await service.removeBackup('non-existent');

      expect(result).toEqual({
        message: 'backup job not found',
        status: 'failed',
      });
    });
  });

  describe('listBackups', () => {
    it('should list all backups successfully', async () => {
      const mockBackupKeys = ['backup:test1', 'backup:test2'];
      const mockBackupData1 = JSON.stringify({
        name: 'test1',
        folder: 'folder1',
        schedule: '0 */6 * * *',
      });
      const mockBackupData2 = JSON.stringify({
        name: 'test2',
        folder: 'folder2',
        schedule: '0 */12 * * *',
      });
      const mockCronJob1 = {
        lastDate: () => new Date(),
        nextDate: () => new Date(),
      };
      const mockCronJob2 = {
        lastDate: () => new Date(),
        nextDate: () => new Date(),
      };

      mockCronJobsMap.has.mockReturnValue(true);
      mockCronJobsMap.get.mockImplementation((key) => {
        if (key === 'test1') return mockCronJob1;
        if (key === 'test2') return mockCronJob2;
        return null;
      });

      cacheService.keys.mockResolvedValue(mockBackupKeys);
      cacheService.get.mockResolvedValueOnce(mockBackupData1);
      cacheService.get.mockResolvedValueOnce(mockBackupData2);

      const result = await service.listBackups();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test1');
      expect(result[0].status).toBe('active');
      expect(result[1].name).toBe('test2');
      expect(result[1].status).toBe('active');
      expect(cacheService.keys).toHaveBeenCalledWith('backup:*');
    });

    it('should handle empty backup list', async () => {
      cacheService.keys.mockResolvedValue([]);

      const result = await service.listBackups();

      expect(result).toEqual([]);
    });

    it('should handle backups without active cron jobs', async () => {
      const mockBackupKeys = ['backup:test1'];
      const mockBackupData1 = JSON.stringify({
        name: 'test1',
        folder: 'folder1',
        schedule: '0 */6 * * *',
      });

      cacheService.keys.mockResolvedValue(mockBackupKeys);
      cacheService.get.mockResolvedValueOnce(mockBackupData1);
      mockCronJobsMap.has.mockReturnValue(false); // No active jobs

      const result = await service.listBackups();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test1');
      expect(result[0].status).toBe('inactive');
    });
  });

  describe('init', () => {
    it('should initialize backups successfully', async () => {
      const mockBackupKeys = ['backup:test1', 'backup:test2'];
      const mockBackupData1 = JSON.stringify({
        name: 'test1',
        schedule: '0 */6 * * *',
      });
      const mockBackupData2 = JSON.stringify({
        name: 'test2',
        schedule: '0 */12 * * *',
      });

      cacheService.keys.mockResolvedValue(mockBackupKeys);
      cacheService.get.mockResolvedValueOnce(mockBackupData1);
      cacheService.get.mockResolvedValueOnce(mockBackupData2);

      jest
        .spyOn(service as any, 'scheduleBackup')
        .mockResolvedValue({ error: null });

      await service.init();

      expect(cacheService.keys).toHaveBeenCalledWith('backup:*');
      expect(service['scheduleBackup']).toHaveBeenCalledTimes(2);
    });

    it('should handle empty backup list during init', async () => {
      cacheService.keys.mockResolvedValue([]);

      await service.init();

      expect(cacheService.keys).toHaveBeenCalledWith('backup:*');
    });
  });
});
