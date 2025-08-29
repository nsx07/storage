import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  UploadedFiles,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { Response } from 'express';
import { StorageService } from '../../storage/services/storage.service';
import { AuthGuard } from '../../../core/guards/auth.guard';
import {
  FileOperationDto,
  FileRenameDto,
  DirectoryOperationDto,
  ZipOperationDto,
} from '../dto/file.dto';
import { FileStatus } from '../interfaces/file.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { buildPath, wwwroot } from '../../../shared/utils/utils';
import { FileServerService } from '../services/file-server.service';

@ApiTags('Storage')
@Controller('api/')
@ApiSecurity('StorageApiKey')
@UseGuards(AuthGuard)
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly fileServerService: FileServerService,
  ) {}

  @Post('save')
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Upload a single file with project metadata',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        projectName: {
          type: 'string',
        },
        projectScope: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file uploaded' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file' }]))
  async uploadFile(
    @UploadedFiles() { file }: { file: Express.Multer.File[] },
    @Query() query: FileOperationDto,
  ) {
    if (!file || !file.length) {
      throw new BadRequestException('No file uploaded');
    }
    return file.map((f) => ({
      fileName: f.filename,
      projectName: query.projectName,
      projectScope: query.projectScope,
      filePath: f.path,
    }));
  }

  @Post('update')
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Upload a single file with project metadata',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        projectName: {
          type: 'string',
        },
        projectScope: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File updated successfully' })
  @ApiResponse({ status: 400, description: 'No file updated' })
  @UseInterceptors(FileInterceptor('file'))
  async updateFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      fileName: file.filename,
      filePath: file.path,
    };
  }

  @Post('createDirectory')
  @ApiOperation({
    summary: 'Create a directory',
    description: 'Creates a new directory at the specified path',
  })
  @ApiBody({ type: DirectoryOperationDto })
  @ApiResponse({ status: 201, description: 'Directory created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid directory path' })
  async createDirectory(@Body() dto: DirectoryOperationDto) {
    const result = await this.storageService.createDirectory(dto.path);
    if (result.status !== FileStatus.SUCCESS) {
      throw new BadRequestException(result.error?.message);
    }
    return result;
  }

  @Delete('deleteDirectory')
  @ApiOperation({
    summary: 'Delete a directory',
    description: 'Deletes a directory and all its contents',
  })
  @ApiQuery({ type: FileOperationDto })
  @ApiResponse({ status: 200, description: 'Directory deleted successfully' })
  @ApiResponse({ status: 404, description: 'Directory not found' })
  async deleteDirectory(@Query() dto: FileOperationDto) {
    const result = await this.storageService.deleteDirectory(buildPath(dto));
    if (result.status === FileStatus.NOT_FOUND) {
      throw new NotFoundException('Directory not found');
    }
    return result;
  }

  @Delete('delete')
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Deletes a file',
  })
  @ApiQuery({ type: FileOperationDto })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async delete(@Query() dto: FileOperationDto) {
    const result = await this.storageService.deleteDirectory(buildPath(dto));
    if (result.status === FileStatus.NOT_FOUND) {
      throw new NotFoundException('File not found');
    }
    return result;
  }

  @Patch('rename')
  @ApiOperation({
    summary: 'Rename a directory',
    description: 'Renames a directory from oldPath to newPath',
  })
  @ApiBody({ type: FileRenameDto })
  @ApiResponse({ status: 200, description: 'Direcotry renamed successfully' })
  @ApiResponse({ status: 404, description: 'Direcotry not found' })
  async rename(@Body() dto: FileRenameDto) {
    const result = await this.storageService.rename(dto.oldPath, dto.newPath);
    if (result.status === FileStatus.NOT_FOUND) {
      throw new NotFoundException('File not found');
    }
    return result;
  }

  @Patch('renameFile')
  @ApiOperation({
    summary: 'Rename a file',
    description: 'Renames a file from oldPath to newPath',
  })
  @ApiBody({ type: FileRenameDto })
  @ApiResponse({ status: 200, description: 'File renamed successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async renameFile(@Body() dto: FileRenameDto) {
    const result = await this.storageService.rename(dto.oldPath, dto.newPath);
    if (result.status === FileStatus.NOT_FOUND) {
      throw new NotFoundException('File not found');
    }
    return result;
  }

  @Get('downloadZip')
  @ApiOperation({
    summary: 'Download directory as ZIP',
    description: 'Compresses a directory into a ZIP file and returns it',
  })
  @ApiQuery({ type: ZipOperationDto })
  @ApiResponse({ status: 200, description: 'ZIP file created successfully' })
  @ApiResponse({ status: 404, description: 'Directory not found' })
  async downloadZip(@Query() dto: ZipOperationDto) {
    const result = await this.storageService.zipDirectory(
      dto.path,
      `temp_${Date.now()}.zip`,
    );
    if (result.status === FileStatus.NOT_FOUND) {
      throw new NotFoundException('Directory not found');
    }
    return result;
  }

  @Put('log')
  @ApiOperation({
    summary: 'Write to log file',
    description: 'Appends content to a log file at the specified path',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Log written successfully' })
  @ApiResponse({ status: 400, description: 'Invalid log path or content' })
  async log(@Body() { path, content }: { path: string; content: string }) {
    const result = await this.storageService.log(path, content);
    if (result.status !== FileStatus.SUCCESS) {
      throw new BadRequestException(result.error?.message);
    }
    return result;
  }

  @Get('stream/:filePath(*)')
  @ApiOperation({
    summary: 'Stream file with Range support',
    description:
      'Stream files with support for partial content (HTTP Range requests)',
  })
  @ApiParam({
    name: 'filePath',
    description: 'Path to the file relative to wwwroot',
    example: 'uploads/image.jpg',
  })
  @ApiResponse({
    status: 206,
    description: 'Partial content returned (for range requests)',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete file returned',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async streamFile(
    @Param('filePath') filePath: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    try {
      return await this.fileServerService.serveFile(filePath, res);
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  @Get('listTree')
  @ApiOperation({
    summary: 'List directory tree',
    description: 'Returns a tree structure of all files and directories',
  })
  @ApiResponse({
    status: 200,
    description: 'Directory tree retrieved successfully',
  })
  async listTree() {
    return [this.storageService.listFromPath(wwwroot)];
  }
}
