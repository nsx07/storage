import { Module } from '@nestjs/common';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { FileServerService } from './services/file-server.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { preparePath, wwwroot } from '../../shared/utils/utils';
import * as path from 'path';
import { promises as fs } from 'fs';

interface FileRequest {
  projectName: string;
  projectScope: string;
  oldFileName?: string;
}

const handleFileRequest = async (req: any): Promise<void> => {
  const request: FileRequest = {
    projectName: req.query.projectName,
    projectScope: req.query.projectScope,
  };

  if (req.method === 'PUT') {
    request.oldFileName = req.query.oldFileName;

    if (request.oldFileName) {
      const filePath = path.join(
        wwwroot,
        request.projectName,
        request.projectScope,
        request.oldFileName,
      );
      await fs.unlink(filePath);
    }
  }
};

const getDestinationPath = async (req: any) => {
  try {
    await handleFileRequest(req);
    const result = await preparePath(
      req.query.projectName,
      req.query.projectScope,
    );
    return result.data;
  } catch (error) {
    req._destroy(error as Error, console.log);
    throw error;
  }
};

const formatFileName = (originalName: string): string => {
  const lastDot = originalName.lastIndexOf('.');
  const name = originalName.slice(0, lastDot).split(' ').join('_');
  const extension = originalName.slice(lastDot + 1);
  return `${name}.${extension}`;
};

const storage = diskStorage({
  destination: async (req, file, callback) => {
    try {
      const path = await getDestinationPath(req);
      callback(null, path);
    } catch (error) {
      callback(error as Error, '');
    }
  },
  filename: (req, file, callback) => {
    callback(null, formatFileName(file.originalname));
  },
});

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: async () => ({
        storage,
      }),
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService, FileServerService],
  exports: [StorageService, FileServerService],
})
export class StorageModule {}
