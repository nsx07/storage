import { Test, TestingModule } from '@nestjs/testing';
import { BackupController } from './backup.controller';
import { BackupService } from '../services/backup.service';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { CreateBackupDto, RestoreBackupDto } from '../dto/backup.dto';
import { BackupResponse, BackupJob } from '../interfaces/backup.interface';

describe('BackupController', () => {
  let controller: BackupController;
  let backupService: jest.Mocked<BackupService>;

  const mockBackupService = {
    backup: jest.fn(),
    restore: jest.fn(),
    removeBackup: jest.fn(),
    listBackups: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [
        {
          provide: BackupService,
          useValue: mockBackupService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BackupController>(BackupController);
    backupService = module.get(BackupService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createBackup', () => {
    it('should create backup successfully', async () => {
      const createBackupDto: CreateBackupDto = {
        name: 'test-backup',
        folder: 'test-folder',
        connectionString: 'postgresql://user:pass@localhost/testdb',
        continuos: false,
        zip: false,
      };

      const expectedResponse: BackupResponse = {
        message: 'backup created successfully',
        status: 'success',
      };

      backupService.backup.mockResolvedValue(expectedResponse);

      const result = await controller.createBackup(createBackupDto);

      expect(backupService.backup).toHaveBeenCalledWith(createBackupDto);
      expect(result).toBe(expectedResponse);
    });

    it('should handle backup creation failure', async () => {
      const createBackupDto: CreateBackupDto = {
        name: 'test-backup',
        folder: 'test-folder',
        connectionString: 'postgresql://user:pass@localhost/testdb',
        continuos: false,
        zip: false,
      };

      const expectedResponse: BackupResponse = {
        message: 'failed to create backup',
        status: 'failed',
        error: 'Database connection failed',
      };

      backupService.backup.mockResolvedValue(expectedResponse);

      const result = await controller.createBackup(createBackupDto);

      expect(result).toBe(expectedResponse);
    });
  });

  describe('updateBackup', () => {
    it('should update backup successfully', async () => {
      const updateBackupDto: CreateBackupDto = {
        name: 'test-backup',
        folder: 'test-folder',
        connectionString: 'postgresql://user:pass@localhost/testdb',
        continuos: true,
        zip: false,
        schedule: '0 */6 * * *',
      };

      const expectedResponse: BackupResponse = {
        message: 'backup updated successfully',
        status: 'success',
      };

      backupService.backup.mockResolvedValue(expectedResponse);

      const result = await controller.updateBackup(updateBackupDto);

      expect(backupService.backup).toHaveBeenCalledWith(updateBackupDto, true);
      expect(result).toBe(expectedResponse);
    });

    it('should handle backup update failure', async () => {
      const updateBackupDto: CreateBackupDto = {
        name: 'non-existent-backup',
        folder: 'test-folder',
        connectionString: 'postgresql://user:pass@localhost/testdb',
        continuos: true,
        zip: false,
      };

      const expectedResponse: BackupResponse = {
        message: 'failed to update backup',
        status: 'failed',
        error: 'Backup job not found',
      };

      backupService.backup.mockResolvedValue(expectedResponse);

      const result = await controller.updateBackup(updateBackupDto);

      expect(result).toBe(expectedResponse);
    });
  });

  describe('restore', () => {
    it('should restore backup successfully', async () => {
      const restoreBackupDto: RestoreBackupDto = {
        name: 'test-backup',
        folder: 'test-folder',
        connectionString: 'postgresql://user:pass@localhost/testdb',
      };

      const expectedResponse: BackupResponse = {
        message: 'backup restored successfully',
        status: 'success',
      };

      backupService.restore.mockResolvedValue(expectedResponse);

      const result = await controller.restore(restoreBackupDto);

      expect(backupService.restore).toHaveBeenCalledWith(restoreBackupDto);
      expect(result).toBe(expectedResponse);
    });

    it('should handle restore failure', async () => {
      const restoreBackupDto: RestoreBackupDto = {
        name: 'non-existent-backup',
        folder: 'test-folder',
        connectionString: 'postgresql://user:pass@localhost/testdb',
      };

      const expectedResponse: BackupResponse = {
        message: 'failed to restore backup',
        status: 'failed',
        error: 'backup file does not exists',
      };

      backupService.restore.mockResolvedValue(expectedResponse);

      const result = await controller.restore(restoreBackupDto);

      expect(result).toBe(expectedResponse);
    });
  });

  describe('removeBackup', () => {
    it('should remove backup successfully', async () => {
      const backupName = 'test-backup';
      const expectedResponse: BackupResponse = {
        message: 'backup job removed successfully',
        status: 'success',
      };

      backupService.removeBackup.mockResolvedValue(expectedResponse);

      const result = await controller.removeBackup(backupName);

      expect(backupService.removeBackup).toHaveBeenCalledWith(backupName);
      expect(result).toBe(expectedResponse);
    });

    it('should handle remove backup failure', async () => {
      const backupName = 'non-existent-backup';
      const expectedResponse: BackupResponse = {
        message: 'backup job not found',
        status: 'failed',
      };

      backupService.removeBackup.mockResolvedValue(expectedResponse);

      const result = await controller.removeBackup(backupName);

      expect(result).toBe(expectedResponse);
    });
  });

  describe('listJobs', () => {
    it('should list all backup jobs successfully', async () => {
      const expectedBackups: BackupJob[] = [
        {
          name: 'backup1',
          schedule: '0 */6 * * *',
          status: 'active',
          lastRun: new Date(),
          nextRun: new Date(),
        },
        {
          name: 'backup2',
          schedule: '0 */12 * * *',
          status: 'inactive',
          lastRun: undefined,
          nextRun: undefined,
        },
      ];

      backupService.listBackups.mockResolvedValue(expectedBackups);

      const result = await controller.listJobs();

      expect(backupService.listBackups).toHaveBeenCalled();
      expect(result).toBe(expectedBackups);
    });

    it('should return empty array when no backups exist', async () => {
      const expectedBackups: BackupJob[] = [];

      backupService.listBackups.mockResolvedValue(expectedBackups);

      const result = await controller.listJobs();

      expect(result).toEqual([]);
    });
  });
});
