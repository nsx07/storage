import { Injectable, Logger } from '@nestjs/common';
import { promises as fs, readdirSync, statSync } from 'fs';
import * as path from 'path';
import { FileStatus, ResponseFile } from '../interfaces/file.interface';
import * as AdmZip from 'adm-zip';
import { parsePlatformPath, stripPath } from '../../../shared/utils/utils';
import { FileView } from '../dto/file.dto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly wwwroot = path.join(process.cwd(), 'wwwroot');

  constructor() {
    this.ensureWwwrootExists();
  }

  private async ensureWwwrootExists() {
    try {
      await fs.access(this.wwwroot);
    } catch {
      await fs.mkdir(this.wwwroot, { recursive: true });
    }
  }

  async createDirectory(dirPath: string): Promise<ResponseFile> {
    try {
      const fullPath = path.join(this.wwwroot, dirPath);
      await fs.mkdir(fullPath, { recursive: true });
      return ResponseFile.fromPath(fullPath).SUCCESS;
    } catch (error) {
      this.logger.error(`Error creating directory: ${error.message}`);
      return new ResponseFile(FileStatus.ERROR, null, error);
    }
  }

  async deleteDirectory(dirPath: string): Promise<ResponseFile> {
    try {
      const fullPath = path.join(this.wwwroot, dirPath);
      await fs.rm(fullPath, { recursive: true, force: true });
      return ResponseFile.fromPath(fullPath).SUCCESS;
    } catch (error) {
      this.logger.error(`Error deleting directory: ${error.message}`);
      return new ResponseFile(FileStatus.ERROR, null, error);
    }
  }

  async rename(oldPath: string, newPath: string): Promise<ResponseFile> {
    try {
      const fullOldPath = path.join(this.wwwroot, oldPath);
      const fullNewPath = path.join(this.wwwroot, newPath);

      if (!(await this.fileExists(fullOldPath))) {
        return ResponseFile.NOT_FOUND;
      }

      await fs.rename(fullOldPath, fullNewPath);
      return ResponseFile.fromPath(fullNewPath).SUCCESS;
    } catch (error) {
      this.logger.error(`Error renaming: ${error.message}`);
      return new ResponseFile(FileStatus.ERROR, null, error);
    }
  }

  async zipDirectory(
    sourcePath: string,
    outputPath: string,
  ): Promise<ResponseFile> {
    const fullSourcePath = path.join(this.wwwroot, sourcePath);
    const fullOutputPath = path.join(this.wwwroot, outputPath);
    try {
      const zip = new AdmZip();

      if (!(await this.fileExists(fullSourcePath))) {
        return ResponseFile.NOT_FOUND;
      }

      zip.addLocalFolder(fullSourcePath);
      zip.writeZip(fullOutputPath);

      return ResponseFile.fromPath(parsePlatformPath(outputPath, true)).SUCCESS;
    } catch (error) {
      this.logger.error(`Error creating zip: ${error.message}`);
      return new ResponseFile(FileStatus.ERROR, null, error);
    }
  }

  async log(logPath: string, content: string): Promise<ResponseFile> {
    try {
      const basePath = path.join(this.wwwroot, 'logs');
      const fullPath = path.join(basePath, logPath);
      const lastSlashIndex = fullPath.lastIndexOf(path.sep);
      const dirPath = fullPath.slice(0, lastSlashIndex);

      if (!(await this.fileExists(dirPath))) {
        await fs.mkdir(dirPath, { recursive: true });
      }

      await fs.appendFile(fullPath, content + '\n');
      return ResponseFile.fromPath(fullPath).SUCCESS;
    } catch (error) {
      this.logger.error(`Error logging: ${error.message}`);
      return new ResponseFile(FileStatus.ERROR, null, error);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readFile(
    filePath: string,
    encoding: BufferEncoding = 'base64',
  ): Promise<ResponseFile> {
    try {
      const fullPath = path.join(this.wwwroot, filePath);
      const data = await fs.readFile(fullPath);
      return new ResponseFile(FileStatus.SUCCESS, data.toString(encoding));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return ResponseFile.NOT_FOUND;
      }
      return new ResponseFile(FileStatus.ERROR, null, error);
    }
  }

  listFromPath(_path: string): FileView | null {
    try {
      const stat = statSync(_path);

      if (stat.isDirectory()) {
        // Skip system directories that may have restricted permissions
        const fileName = path.basename(_path);
        const systemDirectories = ['lost+found', '.Trash-1000', '.cache'];
        
        if (systemDirectories.includes(fileName)) {
          return null;
        }

        let files: string[] = [];
        try {
          files = readdirSync(_path);
        } catch (error) {
          // Skip directories we don't have permission to read
          console.warn(`Skipping directory due to permission error: ${_path}`, error.message);
          return null;
        }

        const tree = files
          .map((file) => {
            const newPath = path.join(_path, file);
            try {
              return this.listFromPath(newPath);
            } catch (error) {
              // Skip files/directories that can't be accessed
              console.warn(`Skipping file/directory due to error: ${newPath}`, error.message);
              return null;
            }
          })
          .filter((item) => item !== null);

        return {
          type: 'folder',
          name: path.basename(_path),
          path: stripPath(_path),
          size: stat.size,
          datetime: stat.mtime,
          content: tree,
        };
      } else {
        return {
          type: 'file',
          path: stripPath(_path),
          name: path.basename(_path),
          datetime: stat.mtime,
          size: stat.size,
        };
      }
    } catch (error) {
      // Skip files/directories that can't be accessed
      console.warn(`Skipping path due to error: ${_path}`, error.message);
      return null;
    }
  }
}
