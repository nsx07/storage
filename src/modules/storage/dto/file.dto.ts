import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class FileOperationDto {
  @IsString()
  @IsOptional()
  fileName: string;

  @IsString()
  @IsOptional()
  projectName?: string;

  @IsString()
  @IsOptional()
  projectScope?: string;
}

export class FileRenameDto {
  @IsString()
  oldPath: string;

  @IsString()
  newPath: string;
}

export class DirectoryOperationDto {
  @IsString()
  path: string;
}

export class ZipOperationDto {
  @IsString()
  path: string;

  @IsBoolean()
  @IsOptional()
  deleteAfter?: boolean;
}

export class FileView {
  type: 'file' | 'folder';
  name: string;
  path: string;
  size: number;
  datetime: Date;
  content?: FileView[];
}
