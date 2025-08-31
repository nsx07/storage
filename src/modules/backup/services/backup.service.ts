import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CacheService } from '../../cache/services/cache.service';
import { StorageService } from '../../storage/services/storage.service';
import {
  BackupOptions,
  BackupResponse,
  BackupJob,
} from '../interfaces/backup.interface';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { promises as fs, constants } from 'fs';
import { CronJob } from 'cron';
import { getPathOSBinary } from '../../../shared/utils/utils';
import { ConfigService } from '@nestjs/config';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly wwwroot: string;

  constructor(
    private readonly storageService: StorageService,
    private readonly cacheService: CacheService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly config: ConfigService,
  ) {
    this.wwwroot = path.join(process.cwd(), 'wwwroot');
  }

  private async verifyBinaryPermissions(binaryName: string): Promise<void> {
    const binaryPath = getPathOSBinary(binaryName);

    // If using system binary (just the command name), check if it's available in PATH
    if (binaryPath === binaryName) {
      try {
        // Test if the binary is available in PATH
        await execAsync(`which ${binaryName}`);
        this.logger.log(`System binary ${binaryName} is available in PATH`);
        return;
      } catch (error) {
        const errorMsg = `System binary ${binaryName} is not available in PATH: ${error.message}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }
    }

    // For custom binaries, check file permissions as before
    try {
      await fs.access(binaryPath, constants.F_OK | constants.X_OK);
      this.logger.log(
        `Binary ${binaryName} is accessible and executable at ${binaryPath}`,
      );
    } catch (error) {
      try {
        await fs.chmod(binaryPath, '0755');
        this.logger.log(
          `Set execute permissions for binary ${binaryName} at ${binaryPath}`,
        );

        await fs.access(binaryPath, constants.F_OK | constants.X_OK);
      } catch (permError) {
        const errorMsg = `Binary ${binaryName} at ${binaryPath} is not accessible or executable: ${permError.message}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }
    }
  }

  async backup(
    payload: BackupOptions,
    update = false,
  ): Promise<BackupResponse> {
    try {
      if (!payload.name || !payload.folder || !payload.connectionString) {
        throw new Error('name, folder and connectionString are required');
      }

      const backupPath = `${this.wwwroot}/backup/${payload.folder}/${payload.name}`;

      const declared = this.schedulerRegistry.getCronJobs().has(payload.name);
      if (declared && !update) {
        this.logger.log(`${payload.name} already exists, executing now`);

        // Update last run time in cache before firing
        const existingJobData = JSON.parse(
          await this.cacheService.get(`backup:${payload.name}`, false),
        );
        existingJobData.lastRun = new Date().toISOString();
        await this.cacheService.set(
          `backup:${payload.name}`,
          JSON.stringify(existingJobData),
        );

        this.schedulerRegistry.getCronJobs().get(payload.name)?.fireOnTick();

        return {
          message:
            'backup already scheduled, executed right now and on schedule time too.',
          status: 'success',
        };
      }

      if (declared && update) {
        this.logger.log(
          `${payload.name} already exists, updating configuration`,
        );
        await this.removeBackup(payload.name);
      }

      await Promise.allSettled([
        this.storageService.createDirectory(`backup/${payload.folder}`),
        this.verifyBinaryPermissions('pg_dump'),
      ]);

      const command = `${getPathOSBinary('pg_dump')} ${payload.zip ? '-F t' : ''} --dbname="${payload.connectionString}" -f "${backupPath}"`;

      if (payload.continuos) {
        payload.path = backupPath;
        payload.command = command;
        payload.key = `backup:${payload.name}`;

        const scheduler = await this.scheduleBackup(payload);
        if (scheduler.error) {
          throw new Error(scheduler.error.message);
        }

        await this.cacheService.set(payload.key, JSON.stringify(payload));
      } else {
        await execAsync(command);
      }

      return {
        message: 'backup created successfully',
        status: 'success',
      };
    } catch (error) {
      this.logger.error(`Backup error: ${error.message}`);
      return {
        message: 'failed to create backup',
        status: 'failed',
        error: error.message,
      };
    }
  }

  async restore(payload: BackupOptions): Promise<BackupResponse> {
    try {
      const backupPath = `${this.wwwroot}/backup/${payload.folder}/${payload.name}`;

      if (!(await this.storageService.fileExists(backupPath))) {
        throw new Error('Backup file not found');
      }

      await this.verifyBinaryPermissions('pg_restore');

      const command = `${getPathOSBinary('pg_restore')} -F t --no-privileges --no-owner --dbname="${payload.connectionString}" "${backupPath}"`;
      const { stdout, stderr } = await execAsync(command);

      await this.saveLog('restore ✔', stdout, stderr, command);

      return {
        message: 'restore completed successfully',
        status: 'success',
      };
    } catch (error) {
      this.logger.error(`Restore error: ${error.message}`);
      await this.saveLog('restore ❌', '', error.message, '');
      return {
        message: 'failed to restore backup',
        status: 'failed',
        error: error.message,
      };
    }
  }

  async scheduleBackup(
    payload: BackupOptions,
    context?: string,
  ): Promise<{ error?: Error }> {
    try {
      if (!payload.cron) {
        throw new Error('Schedule is required for continuous backup');
      }
      const timeZone = this.config.get<string>('TIME_ZONE') || 'UTC';

      const job = new CronJob(
        payload.cron,
        async () => {
          try {
            this.logger.log(
              `Executing scheduled backup: ${payload.name}`,
              context,
            );
            const { stdout, stderr } = await execAsync(payload.command!);

            // Update last run time in cache
            const jobData = JSON.parse(
              await this.cacheService.get(payload.key!, false),
            );
            jobData.lastRun = new Date().toISOString();
            await this.cacheService.set(payload.key!, JSON.stringify(jobData));

            await this.saveLog(
              'scheduled backup ✔',
              stdout,
              stderr,
              payload.command!,
            );
            this.logger.log(
              `Scheduled backup completed: ${payload.name}`,
              context,
            );
          } catch (error) {
            this.logger.error(
              `Scheduled backup failed: ${payload.name} - ${error.message}`,
              context,
            );
            await this.saveLog(
              'scheduled backup ❌',
              '',
              error.message,
              payload.command!,
            );
          }
        },
        null,
        true,
        timeZone,
      );

      job.start();
      this.schedulerRegistry.addCronJob(payload.name, job);
      this.logger.log(
        `Backup job "${payload.name}" scheduled successfully`,
        context,
      );
      return {};
    } catch (error) {
      this.logger.error(
        `Failed to schedule backup job "${payload.name}": ${error.message}`,
        context,
      );
      return { error };
    }
  }

  async removeBackup(name: string): Promise<BackupResponse> {
    try {
      // Handle both formats: just the name or with backup: prefix
      const jobName = name.startsWith('backup:') ? name.split(':').pop() : name;
      const taskKey = `backup:${jobName}`;

      // Check if job exists in scheduler
      const jobExists = this.schedulerRegistry.getCronJobs().has(jobName);

      if (jobExists) {
        this.schedulerRegistry.deleteCronJob(jobName);
        this.logger.log(`Removed scheduled job: ${jobName}`);
      }

      // Remove from cache
      await this.cacheService.del(taskKey);
      this.logger.log(`Removed backup configuration: ${taskKey}`);

      return {
        message: 'backup job removed successfully',
        status: 'success',
      };
    } catch (error) {
      this.logger.error(
        `Failed to remove backup job ${name}: ${error.message}`,
      );

      return {
        message: 'backup job not found',
        status: 'failed',
        error: error.message,
      };
    }
  }

  async listBackups(): Promise<BackupJob[]> {
    const jobs = await this.cacheService.keys('backup:*');
    const backups: BackupJob[] = [];

    for (const job of jobs) {
      const backup = JSON.parse(await this.cacheService.get(job, false));
      const cronJob = this.schedulerRegistry.getCronJobs().get(backup.name);

      backups.push({
        name: backup.name,
        schedule: backup.schedule,
        status: cronJob ? 'active' : 'inactive',
        lastRun: backup.lastRun || cronJob.lastExecution || null,
        nextRun: cronJob?.nextDate(),
        ...backup,
      });
    }

    return backups;
  }

  async init(): Promise<void> {
    const context = 'BackupService.init';
    try {
      this.logger.log(
        'Initializing backup service and restoring scheduled jobs...',
        context,
      );
      const backups = await this.cacheService.keys('backup:*');

      if (backups.length === 0) {
        this.logger.log('No scheduled backup jobs found to restore', context);
        return;
      }

      this.logger.log(
        `Found ${backups.length} backup jobs to restore`,
        context,
      );

      for (const backup of backups) {
        try {
          const job = JSON.parse(await this.cacheService.get(backup, false));
          this.logger.log(`Restoring backup job: ${job.name}`, context);

          // Ensure the command has proper path formatting
          if (job.command && job.path) {
            // Regenerate command with current environment paths
            const command = `${getPathOSBinary('pg_dump')} ${job.zip ? '-F t' : ''} --dbname="${job.connectionString}" -f "${job.path}"`;
            job.command = command;
          }

          await this.scheduleBackup(job, context);
          this.logger.log(
            `Successfully restored backup job: ${job.name}`,
            context,
          );
        } catch (error) {
          this.logger.error(
            `Failed to restore backup job from ${backup}: ${error.message}`,
            context,
          );
        }
      }

      this.logger.log('Backup service initialization completed', context);
    } catch (error) {
      this.logger.error(
        `Failed to initialize backup service: ${error.message}`,
        context,
      );
    }
  }

  private async saveLog(
    message: string,
    stdout: string,
    stderr: string,
    command: string,
  ): Promise<void> {
    const date = new Date().toISOString();
    const logContent = `
      =============== LOG ENTRY ==============
      [${date}] ${message}
      [${date}] command: ${command}
      ===============OUTPUT START================
      [${date}] stdout: ${stdout}
      [${date}] stderr: ${stderr}
      =============== LOG END =================
    `;

    await this.storageService.log(
      `backup/${date.split('T')[0]}_log`,
      logContent,
    );
  }

  parseJobName(name: string): string {
    return `job:${name}`;
  }

  parseTaskName(name: string): string {
    return `backup:${name}`;
  }

  async checkBinaryStatus(): Promise<any> {
    const binaries = ['pg_dump', 'pg_restore', 'pg_dumpall'];
    const results = [];

    for (const binary of binaries) {
      const binaryPath = getPathOSBinary(binary);

      // Check if using system binary (just the command name)
      if (binaryPath === binary) {
        try {
          // Test if the binary is available in PATH
          await execAsync(`which ${binary}`);
          results.push({
            binary,
            path: 'system PATH',
            exists: true,
            executable: true,
            status: 'OK (System Binary)',
          });
        } catch (error) {
          results.push({
            binary,
            path: 'system PATH',
            exists: false,
            executable: false,
            status: 'NOT_FOUND_IN_PATH',
            error: error.message,
          });
        }
      } else {
        // Check custom binary file
        try {
          await fs.access(binaryPath, constants.F_OK);

          try {
            await fs.access(binaryPath, constants.X_OK);
            results.push({
              binary,
              path: binaryPath,
              exists: true,
              executable: true,
              status: 'OK (Custom Binary)',
            });
          } catch (execError) {
            results.push({
              binary,
              path: binaryPath,
              exists: true,
              executable: false,
              status: 'NOT_EXECUTABLE',
              error: execError.message,
            });
          }
        } catch (error) {
          results.push({
            binary,
            path: binaryPath,
            exists: false,
            executable: false,
            status: 'NOT_FOUND',
            error: error.message,
          });
        }
      }
    }

    return {
      platform: process.platform,
      architecture: process.arch,
      workingDirectory: process.cwd(),
      binaries: results,
    };
  }
}
