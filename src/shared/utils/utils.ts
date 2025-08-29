import dns from 'dns';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as process from 'process';
import { FileOperationDto } from 'src/modules/storage/dto/file.dto';
import {
  FileStatus,
  ResponseFile,
} from 'src/modules/storage/interfaces/file.interface';

export const wwwroot = path.join(process.cwd(), 'wwwroot');

export type Complex = unknown;

export type FileRequest = {
  files: Array<{ filename: string; path: string }>;
  file: { filename: string; path: string };
  query: { projectName: any; projectScope: any };
};

export type FileResponse = {
  fileName: string;
  projectName: string;
  projectScope: string;
  filePath: string;
};

export const prepareResponseFile = (
  request: FileRequest | any,
): FileResponse | FileResponse[] => {
  if (request.files) {
    return request.files.map((file: any) => {
      return {
        fileName: file.filename,
        projectName: request.query.projectName,
        projectScope: request.query.projectScope,
        filePath: stripPath(file.path),
      };
    });
  }

  return {
    fileName: request.file.filename,
    projectName: request.query.projectName,
    projectScope: request.query.projectScope,
    filePath: stripPath(request.file.path),
  };
};

export function stripPath(_path = '') {
  return parsePlatformPath(_path.slice(_path.indexOf('wwwroot') + 7));
}

export type UrlObject = {
  projectName: string;
  projectScope: string;
  fileName: string;
};
export function convertObjectUrlParsed(
  obj: Partial<UrlObject>,
  isFile = false,
) {
  let url = wwwroot;

  if (obj.projectName) {
    url += `/${obj.projectName}`;
  }

  if (obj.projectScope) {
    url += `/${obj.projectScope}`;
  }

  if (obj.fileName && (isFile || !obj.fileName.includes('.'))) {
    url += `/${obj.fileName}`;
  }

  // check platform UNIX OR POSIX
  return parsePlatformPath(url);
}

export function convertUrlParsedObject(url: string) {
  const urlParsed = url.split('/').filter((value) => value != '');
  const projectName = parsePlatformPath(urlParsed[0]);
  const fileName = parsePlatformPath(urlParsed[urlParsed.length - 1]);
  let projectScope = parsePlatformPath(
    urlParsed.slice(1, urlParsed.length - 1).join('/'),
  );

  if (urlParsed.length <= 2) {
    projectScope = '';
  }

  return { projectName, projectScope, fileName };
}

export function parsePlatformPath(path: string, toBrowser = false) {
  const reg = new RegExp(`[\/\\\\]+`, 'g');
  if (detectPlatform() == 'win32' && !toBrowser) {
    return path.replaceAll(reg, '\\');
  } else {
    return path.replaceAll(reg, '/');
  }
}

export function parsePlatformPathWithRoot(path: string) {
  return parsePlatformPath(wwwroot + '/' + path);
}

export function detectPlatform() {
  return process.platform;
}

export async function isConnect() {
  return new Promise((resolve, reject) => {
    try {
      dns.lookup('google.com', (err) => {
        if (err && err.code == 'ENOTFOUND') {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export const VALIDATOR = {
  critical: (path: string, isDelete = true) => {
    preventPathTraversal(path);
    isDelete && preventRootExclusion(path);
    return path;
  },
};

function preventPathTraversal(path: string) {
  if (path.includes('..')) {
    throw new Error('path traversal is not allowed');
  }
}

function preventRootExclusion(path: string) {
  if (path === wwwroot) {
    throw new Error('root cannot change!');
  }
}

export const multipleValuesSamePurpose = <T = unknown>(
  values: T[],
  call: (value: T) => void | boolean,
  singleMatch = false,
) => {
  for (const value of values) {
    if (call(value) && singleMatch) {
      return;
    }
  }
};

export const isObject = (value: unknown) => {
  return typeof value === 'object' && value !== null;
};

export function buildPath(dto: FileOperationDto) {
  let path = '';

  if (dto.projectName) {
    path += `${dto.projectName}/`;
  }

  if (dto.projectScope) {
    path += `${dto.projectScope}/`;
  }

  if (dto.fileName) {
    path += `${dto.fileName}`;
  }

  return path;
}

export async function preparePath(projectName: string, projectScope: string) {
  return new Promise<ResponseFile>(async (resolve, reject) => {
    const path_ = path.join(
      [wwwroot, projectName, projectScope]
        .filter((a) => a && a != ' ')
        .join('/'),
    );
    try {
      await fs.mkdir(path_, { recursive: true });
      resolve(ResponseFile.fromPath(path_).SUCCESS);
    } catch (err) {
      reject(new ResponseFile(FileStatus.ERROR, null, err));
    }
  });
}

export function getPathOSBinary(command: string) {
  const osCommand = process.platform === 'win32' ? `${command}.exe` : command;
  const pathCommand = `${process.cwd()}/binaries${
    process.platform === 'win32' ? '/windows/bin/' : '/linux/bin/'
  }`;

  return `${pathCommand}${osCommand}`;
}
