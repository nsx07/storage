import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BackupService } from '../services/backup.service';
import { CreateBackupDto, RestoreBackupDto } from '../dto/backup.dto';
import { AuthGuard } from '../../../core/guards/auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';

@ApiTags('Backup')
@Controller('api')
@UseGuards(AuthGuard)
@ApiSecurity('StorageApiKey')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('backup')
  @ApiOperation({
    summary: 'Create a new backup',
    description:
      'Creates a new backup of the specified database with given configuration',
  })
  @ApiBody({ type: CreateBackupDto })
  @ApiResponse({
    status: 201,
    description: 'Backup created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
  })
  async createBackup(@Body() createBackupDto: CreateBackupDto) {
    return await this.backupService.backup(createBackupDto);
  }

  @Post('updateBackup')
  @ApiOperation({
    summary: 'Update existing backup',
    description: 'Updates configuration of an existing backup job',
  })
  @ApiBody({ type: CreateBackupDto })
  @ApiResponse({
    status: 200,
    description: 'Backup updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Backup job not found',
  })
  async updateBackup(@Body() createBackupDto: CreateBackupDto) {
    return await this.backupService.backup(createBackupDto, true);
  }

  @Post('restore')
  @ApiOperation({
    summary: 'Restore a backup',
    description: 'Restores a database from an existing backup file',
  })
  @ApiBody({ type: RestoreBackupDto })
  @ApiResponse({
    status: 200,
    description: 'Backup restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Backup file not found',
  })
  async restore(@Body() restoreBackupDto: RestoreBackupDto) {
    return await this.backupService.restore(restoreBackupDto);
  }

  @Delete('removeBackup')
  @ApiOperation({
    summary: 'Remove a backup job',
    description: 'Removes a scheduled backup job by its name',
  })
  @ApiQuery({
    name: 'name',
    type: String,
    description: 'Name of the backup job to remove',
  })
  @ApiResponse({
    status: 200,
    description: 'Backup job removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Backup job not found',
  })
  async removeBackup(@Query('name') name: string) {
    return await this.backupService.removeBackup(name);
  }

  @Get('listBackups')
  @ApiOperation({
    summary: 'List all backup jobs',
    description:
      'Returns a list of all configured backup jobs and their status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of backup jobs retrieved successfully',
    type: [CreateBackupDto],
  })
  async listJobs() {
    return await this.backupService.listBackups();
  }
}
