import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBackupDto {
  @IsString()
  name: string;

  @IsString()
  folder: string;

  @IsString()
  connectionString: string;

  @IsBoolean()
  @IsOptional()
  zip?: boolean;

  @IsBoolean()
  @IsOptional()
  continuos?: boolean;

  @IsString()
  @IsOptional()
  schedule?: string;
}

export class RestoreBackupDto {
  @IsString()
  name: string;

  @IsString()
  folder: string;

  @IsString()
  connectionString: string;
}
