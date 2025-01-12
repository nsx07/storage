import { IsString, IsNotEmpty } from 'class-validator';

export class FileOperationDto {
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @IsString()
  @IsNotEmpty()
  projectScope: string;
}

export class FileRenameDto extends FileOperationDto {
  @IsString()
  @IsNotEmpty()
  oldPath: string;

  @IsString()
  @IsNotEmpty()
  newPath: string;
}
