import { preparePath, wwwroot } from './utils';
import * as path from 'path';
import { promises as fs } from 'fs';
import { diskStorage } from 'multer';

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

export const storage = diskStorage({
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
