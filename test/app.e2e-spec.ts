import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/modules/storage/services/storage.service';
import { CacheService } from '../src/modules/cache/services/cache.service';
import { BackupService } from '../src/modules/backup/services/backup.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const mockStorageService = {
    createDirectory: jest.fn(),
    deleteDirectory: jest.fn(),
    rename: jest.fn(),
    zipDirectory: jest.fn(),
    readFile: jest.fn(),
    fileExists: jest.fn(),
    log: jest.fn(),
    listFromPath: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  };

  const mockBackupService = {
    init: jest.fn(),
    backup: jest.fn(), // This is the method the controller calls
    restore: jest.fn(), // This is the method the controller calls
    removeBackup: jest.fn(), // This is the method the controller calls
    listBackups: jest.fn(), // This is the method the controller calls
    scheduleBackup: jest.fn(),
    cancelScheduledBackup: jest.fn(),
    getBackupStatus: jest.fn(),
    log: jest.fn(),
  };

  beforeAll(async () => {
    // Set environment variables for testing
    process.env.BYPASS = 'true';
    process.env.STORAGE_TOKEN = 'test-api-key';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .overrideProvider(CacheService)
      .useValue(mockCacheService)
      .overrideProvider(BackupService)
      .useValue(mockBackupService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    // Set up environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.STORAGE_API_KEY = 'test-api-key';

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Root endpoint', () => {
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect('Hello World!');
    });
  });
  describe('Storage API', () => {
    const apiHeaders = {
      'x-api-key': 'test-api-key',
    };

    describe('POST /api/createDirectory', () => {
      it('should create directory successfully', () => {
        mockStorageService.createDirectory.mockResolvedValue({
          status: 'SUCCESS',
          data: '/test/directory',
          error: null,
        } as any);

        return request(app.getHttpServer())
          .post('/api/createDirectory')
          .set(apiHeaders)
          .send({ path: 'test-directory' })
          .expect(201)
          .expect((res) => {
            expect(res.body.status).toBe('SUCCESS');
            expect(mockStorageService.createDirectory).toHaveBeenCalledWith(
              'test-directory',
            );
          });
      });

      it('should return 400 for invalid input', () => {
        return request(app.getHttpServer())
          .post('/api/createDirectory')
          .set(apiHeaders)
          .send({}) // missing path
          .expect(400);
      });

      it('should work without API key when BYPASS is enabled', () => {
        return request(app.getHttpServer())
          .post('/api/createDirectory')
          .send({ path: 'test-directory' })
          .expect(201);
      });
    });

    describe('DELETE /api/deleteDirectory', () => {
      it('should delete directory successfully', () => {
        mockStorageService.deleteDirectory.mockResolvedValue({
          status: 'SUCCESS',
          data: '/test/directory',
          error: null,
        } as any);

        return request(app.getHttpServer())
          .delete('/api/deleteDirectory')
          .set(apiHeaders)
          .query({ fileName: 'test-directory' })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe('SUCCESS');
          });
      });

      it('should return 404 for non-existent directory', () => {
        mockStorageService.deleteDirectory.mockResolvedValue({
          status: 'NOT_FOUND',
          data: null,
          error: null,
        } as any);

        return request(app.getHttpServer())
          .delete('/api/deleteDirectory')
          .set(apiHeaders)
          .query({ fileName: 'non-existent' })
          .expect(404);
      });
    });

    describe('PATCH /api/rename', () => {
      it('should rename directory successfully', () => {
        mockStorageService.rename.mockResolvedValue({
          status: 'SUCCESS',
          data: '/new/path',
          error: null,
        } as any);

        return request(app.getHttpServer())
          .patch('/api/rename')
          .set(apiHeaders)
          .send({ oldPath: 'old-name', newPath: 'new-name' })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe('SUCCESS');
            expect(mockStorageService.rename).toHaveBeenCalledWith(
              'old-name',
              'new-name',
            );
          });
      });

      it('should return 404 for non-existent file', () => {
        mockStorageService.rename.mockResolvedValue({
          status: 'NOT_FOUND',
          data: null,
          error: null,
        } as any);

        return request(app.getHttpServer())
          .patch('/api/rename')
          .set(apiHeaders)
          .send({ oldPath: 'non-existent', newPath: 'new-name' })
          .expect(404);
      });
    });

    describe('GET /api/downloadZip', () => {
      it('should create and download zip successfully', () => {
        mockStorageService.zipDirectory.mockResolvedValue({
          status: 'SUCCESS',
          data: '/path/to/file.zip',
          error: null,
        } as any);

        return request(app.getHttpServer())
          .get('/api/downloadZip')
          .set(apiHeaders)
          .query({ path: 'test-directory' })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe('SUCCESS');
          });
      });

      it('should return 404 for non-existent directory', () => {
        mockStorageService.zipDirectory.mockResolvedValue({
          status: 'NOT_FOUND',
          data: null,
          error: null,
        } as any);

        return request(app.getHttpServer())
          .get('/api/downloadZip')
          .set(apiHeaders)
          .query({ path: 'non-existent' })
          .expect(404);
      });
    });

    describe('PUT /api/log', () => {
      it('should write log successfully', () => {
        mockStorageService.log.mockResolvedValue({
          status: 'SUCCESS',
          data: '/logs/test.log',
          error: null,
        } as any);

        return request(app.getHttpServer())
          .put('/api/log')
          .set(apiHeaders)
          .send({ path: 'test.log', content: 'Log message' })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe('SUCCESS');
            expect(mockStorageService.log).toHaveBeenCalledWith(
              'test.log',
              'Log message',
            );
          });
      });
    });

    describe('GET /api/listTree', () => {
      it('should list directory tree', () => {
        const mockTree = {
          type: 'folder',
          name: 'wwwroot',
          path: '/wwwroot',
          size: 1024,
          datetime: '2025-08-29T18:14:23.857Z',
          content: [],
        };

        mockStorageService.listFromPath.mockReturnValue(mockTree);

        return request(app.getHttpServer())
          .get('/api/listTree')
          .set(apiHeaders)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0]).toEqual(mockTree);
          });
      });
    });
  });

  describe('Backup API', () => {
    const apiHeaders = {
      'x-api-key': 'test-api-key',
    };

    describe('POST /api/backup', () => {
      it('should create backup successfully', () => {
        mockBackupService.backup.mockResolvedValue({
          message: 'backup created successfully',
          status: 'success',
        });

        return request(app.getHttpServer())
          .post('/api/backup')
          .set(apiHeaders)
          .send({
            name: 'test-backup',
            folder: 'test-folder',
            connectionString: 'postgresql://user:pass@localhost/testdb',
            continuos: false,
            zip: false,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.status).toBe('success');
            expect(res.body.message).toBe('backup created successfully');
          });
      });

      it('should return 400 for invalid input', () => {
        return request(app.getHttpServer())
          .post('/api/backup')
          .set(apiHeaders)
          .send({}) // missing required fields
          .expect(400);
      });
    });

    describe('POST /api/restore', () => {
      it('should restore backup successfully', () => {
        mockBackupService.restore.mockResolvedValue({
          message: 'backup restored successfully',
          status: 'success',
        });

        return request(app.getHttpServer())
          .post('/api/restore')
          .set(apiHeaders)
          .send({
            name: 'test-backup',
            folder: 'test-folder',
            connectionString: 'postgresql://user:pass@localhost/testdb',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.status).toBe('success');
            expect(res.body.message).toBe('backup restored successfully');
          });
      });
    });

    describe('DELETE /api/removeBackup', () => {
      it('should remove backup successfully', () => {
        mockBackupService.removeBackup.mockResolvedValue({
          message: 'backup job removed successfully',
          status: 'success',
        });

        return request(app.getHttpServer())
          .delete('/api/removeBackup')
          .set(apiHeaders)
          .query({ name: 'test-backup' })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe('success');
          });
      });
    });

    describe('GET /api/listBackups', () => {
      it('should list all backups', () => {
        const mockBackups = [
          {
            name: 'backup1',
            schedule: '0 */6 * * *',
            status: 'active',
            lastRun: '2025-08-29T18:14:23.924Z',
            nextRun: '2025-08-29T18:14:23.924Z',
          },
        ];

        mockBackupService.listBackups.mockResolvedValue(mockBackups);

        return request(app.getHttpServer())
          .get('/api/listBackups')
          .set(apiHeaders)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toEqual(mockBackups);
          });
      });
    });
  });
});
