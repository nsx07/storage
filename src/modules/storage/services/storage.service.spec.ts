import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../services/storage.service';
import { Logger } from '@nestjs/common';
import { promises as fs, readdirSync, statSync } from 'fs';
import { FileStatus } from '../interfaces/file.interface';
import * as AdmZip from 'adm-zip';

// Mock AdmZip
jest.mock('adm-zip');
const MockedAdmZip = AdmZip as jest.MockedClass<typeof AdmZip>;

describe('StorageService', () => {
  let service: StorageService;
  let mockFs: jest.Mocked<typeof fs>;
  let mockReaddirSync: jest.MockedFunction<typeof readdirSync>;
  let mockStatSync: jest.MockedFunction<typeof statSync>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
    mockFs = fs as jest.Mocked<typeof fs>;
    mockReaddirSync = readdirSync as jest.MockedFunction<typeof readdirSync>;
    mockStatSync = statSync as jest.MockedFunction<typeof statSync>;

    // Reset all mocks
    jest.clearAllMocks();

    // Mock logger to avoid console output in tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  describe('ensureWwwrootExists', () => {
    it('should create wwwroot directory if it does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(
        new Error('Directory does not exist'),
      );
      mockFs.mkdir.mockResolvedValueOnce(undefined);

      await service['ensureWwwrootExists']();

      expect(mockFs.access).toHaveBeenCalledWith(
        expect.stringContaining('wwwroot'),
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('wwwroot'),
        { recursive: true },
      );
    });

    it('should not create directory if it already exists', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);

      await service['ensureWwwrootExists']();

      expect(mockFs.access).toHaveBeenCalledWith(
        expect.stringContaining('wwwroot'),
      );
      expect(mockFs.mkdir).not.toHaveBeenCalled();
    });
  });

  describe('createDirectory', () => {
    it('should create directory successfully', async () => {
      mockFs.mkdir.mockResolvedValueOnce(undefined);

      const result = await service.createDirectory('test-dir');

      expect(result.status).toBe(FileStatus.SUCCESS);
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('test-dir'),
        { recursive: true },
      );
    });

    it('should handle directory creation error', async () => {
      const error = new Error('Permission denied');
      mockFs.mkdir.mockRejectedValueOnce(error);

      const result = await service.createDirectory('test-dir');

      expect(result.status).toBe(FileStatus.ERROR);
      expect(result.error).toBe(error);
    });
  });

  describe('deleteDirectory', () => {
    it('should delete directory successfully', async () => {
      mockFs.rm.mockResolvedValueOnce(undefined);

      const result = await service.deleteDirectory('test-dir');

      expect(result.status).toBe(FileStatus.SUCCESS);
      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringContaining('test-dir'),
        { recursive: true, force: true },
      );
    });

    it('should handle directory deletion error', async () => {
      const error = new Error('Directory not found');
      mockFs.rm.mockRejectedValueOnce(error);

      const result = await service.deleteDirectory('test-dir');

      expect(result.status).toBe(FileStatus.ERROR);
      expect(result.error).toBe(error);
    });
  });

  describe('rename', () => {
    it('should rename file/directory successfully', async () => {
      // Mock file exists check
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.rename.mockResolvedValueOnce(undefined);

      const result = await service.rename('old-name', 'new-name');

      expect(result.status).toBe(FileStatus.SUCCESS);
      expect(mockFs.rename).toHaveBeenCalledWith(
        expect.stringContaining('old-name'),
        expect.stringContaining('new-name'),
      );
    });

    it('should return NOT_FOUND if source file does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));

      const result = await service.rename('old-name', 'new-name');

      expect(result.status).toBe(FileStatus.NOT_FOUND);
      expect(mockFs.rename).not.toHaveBeenCalled();
    });

    it('should handle rename error', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      const error = new Error('Permission denied');
      mockFs.rename.mockRejectedValueOnce(error);

      const result = await service.rename('old-name', 'new-name');

      expect(result.status).toBe(FileStatus.ERROR);
      expect(result.error).toBe(error);
    });
  });

  describe('zipDirectory', () => {
    it('should create zip file successfully', async () => {
      const mockZip = {
        addLocalFolder: jest.fn(),
        writeZip: jest.fn(),
      };
      MockedAdmZip.mockImplementation(() => mockZip as any);

      // Mock file exists check
      mockFs.access.mockResolvedValueOnce(undefined);

      const result = await service.zipDirectory('source-dir', 'output.zip');

      expect(result.status).toBe(FileStatus.SUCCESS);
      expect(mockZip.addLocalFolder).toHaveBeenCalled();
      expect(mockZip.writeZip).toHaveBeenCalled();
    });

    it('should return NOT_FOUND if source directory does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('Directory not found'));

      const result = await service.zipDirectory('source-dir', 'output.zip');

      expect(result.status).toBe(FileStatus.NOT_FOUND);
    });

    it('should handle zip creation error', async () => {
      const mockZip = {
        addLocalFolder: jest.fn(),
        writeZip: jest.fn().mockImplementation(() => {
          throw new Error('Zip error');
        }),
      };
      MockedAdmZip.mockImplementation(() => mockZip as any);

      mockFs.access.mockResolvedValueOnce(undefined);

      const result = await service.zipDirectory('source-dir', 'output.zip');

      expect(result.status).toBe(FileStatus.ERROR);
    });
  });

  describe('log', () => {
    it('should append log content successfully', async () => {
      mockFs.access.mockRejectedValueOnce(
        new Error('Directory does not exist'),
      );
      mockFs.mkdir.mockResolvedValueOnce(undefined);
      mockFs.appendFile.mockResolvedValueOnce(undefined);

      const result = await service.log('test.log', 'Log message');

      expect(result.status).toBe(FileStatus.SUCCESS);
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('test.log'),
        'Log message\n',
      );
    });

    it('should handle logging error', async () => {
      const error = new Error('Write permission denied');
      mockFs.access.mockRejectedValueOnce(
        new Error('Directory does not exist'),
      );
      mockFs.mkdir.mockResolvedValueOnce(undefined);
      mockFs.appendFile.mockRejectedValueOnce(error);

      const result = await service.log('test.log', 'Log message');

      expect(result.status).toBe(FileStatus.ERROR);
      expect(result.error).toBe(error);
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);

      const result = await service.fileExists('test-file.txt');

      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));

      const result = await service.fileExists('test-file.txt');

      expect(result).toBe(false);
    });
  });

  describe('readFile', () => {
    it('should read file successfully with default encoding', async () => {
      const mockBuffer = Buffer.from('test content', 'utf8');
      mockFs.readFile.mockResolvedValueOnce(mockBuffer);

      const result = await service.readFile('test-file.txt');

      expect(result.status).toBe(FileStatus.SUCCESS);
      expect(result.data).toBe(mockBuffer.toString('base64'));
    });

    it('should read file with specified encoding', async () => {
      const mockBuffer = Buffer.from('test content', 'utf8');
      mockFs.readFile.mockResolvedValueOnce(mockBuffer);

      const result = await service.readFile('test-file.txt', 'utf8');

      expect(result.status).toBe(FileStatus.SUCCESS);
      expect(result.data).toBe('test content');
    });

    it('should return NOT_FOUND for non-existent file', async () => {
      const error = new Error('File not found');
      (error as any).code = 'ENOENT';
      mockFs.readFile.mockRejectedValueOnce(error);

      const result = await service.readFile('nonexistent.txt');

      expect(result.status).toBe(FileStatus.NOT_FOUND);
    });

    it('should handle other read errors', async () => {
      const error = new Error('Permission denied');
      mockFs.readFile.mockRejectedValueOnce(error);

      const result = await service.readFile('test-file.txt');

      expect(result.status).toBe(FileStatus.ERROR);
      expect(result.error).toBe(error);
    });
  });

  describe('listFromPath', () => {
    it('should list directory contents', () => {
      const mockStats = {
        isDirectory: () => true,
        size: 1024,
        mtime: new Date('2023-01-01'),
      };
      mockStatSync.mockReturnValueOnce(mockStats as any);
      mockReaddirSync.mockReturnValueOnce(['file1.txt', 'subdir'] as any);

      // Mock stats for child items
      const fileStats = {
        isDirectory: () => false,
        size: 512,
        mtime: new Date('2023-01-01'),
      };
      mockStatSync.mockReturnValueOnce(fileStats as any);
      mockStatSync.mockReturnValueOnce(fileStats as any);

      const result = service.listFromPath('/test/path');

      expect(result.type).toBe('folder');
      expect(result.name).toBe('path');
      expect(result.content).toHaveLength(2);
    });

    it('should return file information for files', () => {
      const mockStats = {
        isDirectory: () => false,
        size: 512,
        mtime: new Date('2023-01-01'),
      };
      mockStatSync.mockReturnValueOnce(mockStats as any);

      const result = service.listFromPath('/test/file.txt');

      expect(result.type).toBe('file');
      expect(result.name).toBe('file.txt');
      expect(result.size).toBe(512);
    });
  });
});
