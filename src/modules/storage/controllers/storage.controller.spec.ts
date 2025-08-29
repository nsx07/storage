import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { StorageService } from '../services/storage.service';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FileStatus, ResponseFile } from '../interfaces/file.interface';
import {
  FileOperationDto,
  FileRenameDto,
  DirectoryOperationDto,
  ZipOperationDto,
} from '../dto/file.dto';

describe('StorageController', () => {
  let controller: StorageController;
  let storageService: jest.Mocked<StorageService>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StorageController>(StorageController);
    storageService = module.get(StorageService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createDirectory', () => {
    it('should create directory successfully', async () => {
      const mockResponse = new ResponseFile(FileStatus.SUCCESS, '/test/path');
      storageService.createDirectory.mockResolvedValue(mockResponse);

      const dto: DirectoryOperationDto = { path: 'test-dir' };
      const result = await controller.createDirectory(dto);

      expect(storageService.createDirectory).toHaveBeenCalledWith('test-dir');
      expect(result).toBe(mockResponse);
    });

    it('should throw BadRequestException on directory creation error', async () => {
      const error = new Error('Creation failed');
      const mockResponse = new ResponseFile(FileStatus.ERROR, null, error);
      storageService.createDirectory.mockResolvedValue(mockResponse);

      const dto: DirectoryOperationDto = { path: 'test-dir' };

      await expect(controller.createDirectory(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteDirectory', () => {
    it('should delete directory successfully', async () => {
      const mockResponse = new ResponseFile(FileStatus.SUCCESS, '/test/path');
      storageService.deleteDirectory.mockResolvedValue(mockResponse);

      const dto: FileOperationDto = { fileName: 'test-dir' };
      const result = await controller.deleteDirectory(dto);

      expect(storageService.deleteDirectory).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should throw NotFoundException when directory not found', async () => {
      const mockResponse = new ResponseFile(FileStatus.NOT_FOUND, null);
      storageService.deleteDirectory.mockResolvedValue(mockResponse);

      const dto: FileOperationDto = { fileName: 'test-dir' };

      await expect(controller.deleteDirectory(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete file successfully', async () => {
      const mockResponse = new ResponseFile(FileStatus.SUCCESS, '/test/path');
      storageService.deleteDirectory.mockResolvedValue(mockResponse);

      const dto: FileOperationDto = { fileName: 'test-file.txt' };
      const result = await controller.delete(dto);

      expect(storageService.deleteDirectory).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should throw NotFoundException when file not found', async () => {
      const mockResponse = new ResponseFile(FileStatus.NOT_FOUND, null);
      storageService.deleteDirectory.mockResolvedValue(mockResponse);

      const dto: FileOperationDto = { fileName: 'test-file.txt' };

      await expect(controller.delete(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('rename', () => {
    it('should rename directory successfully', async () => {
      const mockResponse = new ResponseFile(FileStatus.SUCCESS, '/new/path');
      storageService.rename.mockResolvedValue(mockResponse);

      const dto: FileRenameDto = { oldPath: 'old-name', newPath: 'new-name' };
      const result = await controller.rename(dto);

      expect(storageService.rename).toHaveBeenCalledWith(
        'old-name',
        'new-name',
      );
      expect(result).toBe(mockResponse);
    });

    it('should throw NotFoundException when directory not found', async () => {
      const mockResponse = new ResponseFile(FileStatus.NOT_FOUND, null);
      storageService.rename.mockResolvedValue(mockResponse);

      const dto: FileRenameDto = { oldPath: 'old-name', newPath: 'new-name' };

      await expect(controller.rename(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('renameFile', () => {
    it('should rename file successfully', async () => {
      const mockResponse = new ResponseFile(FileStatus.SUCCESS, '/new/path');
      storageService.rename.mockResolvedValue(mockResponse);

      const dto: FileRenameDto = {
        oldPath: 'old-file.txt',
        newPath: 'new-file.txt',
      };
      const result = await controller.renameFile(dto);

      expect(storageService.rename).toHaveBeenCalledWith(
        'old-file.txt',
        'new-file.txt',
      );
      expect(result).toBe(mockResponse);
    });

    it('should throw NotFoundException when file not found', async () => {
      const mockResponse = new ResponseFile(FileStatus.NOT_FOUND, null);
      storageService.rename.mockResolvedValue(mockResponse);

      const dto: FileRenameDto = {
        oldPath: 'old-file.txt',
        newPath: 'new-file.txt',
      };

      await expect(controller.renameFile(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('downloadZip', () => {
    it('should create zip successfully', async () => {
      const mockResponse = new ResponseFile(
        FileStatus.SUCCESS,
        '/zip/path.zip',
      );
      storageService.zipDirectory.mockResolvedValue(mockResponse);

      const dto: ZipOperationDto = { path: 'source' };
      const result = await controller.downloadZip(dto);

      expect(storageService.zipDirectory).toHaveBeenCalledWith(
        'source',
        expect.stringContaining('temp_'),
      );
      expect(result).toBe(mockResponse);
    });

    it('should throw NotFoundException when source directory not found', async () => {
      const mockResponse = new ResponseFile(FileStatus.NOT_FOUND, null);
      storageService.zipDirectory.mockResolvedValue(mockResponse);

      const dto: ZipOperationDto = { path: 'source' };

      await expect(controller.downloadZip(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('log', () => {
    it('should write log successfully', async () => {
      const mockResponse = new ResponseFile(FileStatus.SUCCESS, '/log/path');
      storageService.log.mockResolvedValue(mockResponse);

      const logData = { path: 'test.log', content: 'Log message' };
      const result = await controller.log(logData);

      expect(storageService.log).toHaveBeenCalledWith(
        'test.log',
        'Log message',
      );
      expect(result).toBe(mockResponse);
    });

    it('should throw BadRequestException on log error', async () => {
      const error = new Error('Log error');
      const mockResponse = new ResponseFile(FileStatus.ERROR, null, error);
      storageService.log.mockResolvedValue(mockResponse);

      const logData = { path: 'test.log', content: 'Log message' };

      await expect(controller.log(logData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateFile', () => {
    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.updateFile(null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle file update successfully', async () => {
      const mockFile = {
        filename: 'test.txt',
        path: '/uploads/test.txt',
      } as Express.Multer.File;

      const result = await controller.updateFile(mockFile);

      expect(result).toEqual({
        fileName: 'test.txt',
        filePath: '/uploads/test.txt',
      });
    });
  });

  describe('listTree', () => {
    it('should list directory tree', async () => {
      const mockFileView = {
        type: 'folder' as const,
        name: 'wwwroot',
        path: '/wwwroot',
        size: 1024,
        datetime: new Date(),
        content: [],
      };

      storageService.listFromPath.mockReturnValue(mockFileView);

      const result = await controller.listTree();

      expect(storageService.listFromPath).toHaveBeenCalled();
      expect(result).toEqual([mockFileView]);
    });
  });
});
