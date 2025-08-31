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

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly wwwroot: string;

  constructor(
    private readonly storageService: StorageService,
    private readonly cacheService: CacheService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.wwwroot = path.join(process.cwd(), 'wwwroot');
  }

  private async verifyBinaryPermissions(binaryName: string): Promise<void> {
    const binaryPath = getPathOSBinary(binaryName);

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

      const command = `${getPathOSBinary('pg_dump')} ${payload.zip ? '-F t' : ''} --dbname=${payload.connectionString} >> ${backupPath}`;

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

      const command = `${getPathOSBinary('pg_restore')} -F t --no-privileges --no-owner --dbname=${payload.connectionString} ${backupPath}`;
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

  async scheduleBackup(payload: BackupOptions): Promise<{ error?: Error }> {
    try {
      if (!payload.cron) {
        throw new Error('Schedule is required for continuous backup');
      }

      const job = new CronJob(payload.cron, async () => {
        try {
          await execAsync(payload.command!);
          await this.saveLog('scheduled backup ✔', '', '', payload.command!);
        } catch (error) {
          await this.saveLog(
            'scheduled backup ❌',
            '',
            error.message,
            payload.command!,
          );
        }
      });

      this.schedulerRegistry.addCronJob(payload.name, job);
      return {};
    } catch (error) {
      return { error };
    }
  }

  async removeBackup(name: string): Promise<BackupResponse> {
    try {
      const jobKey = name.split(':').pop();
      const taskKey = `backup:${jobKey}`;

      this.schedulerRegistry.deleteCronJob(jobKey);
      await this.cacheService.del(taskKey);

      return {
        message: 'backup job removed successfully',
        status: 'success',
      };
    } catch (error) {
      console.log(error);

      return {
        message: 'backup job not found',
        status: 'failed',
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
        lastRun: cronJob?.lastDate(),
        nextRun: cronJob?.nextDate(),
        ...backup,
      });
    }

    return backups;
  }

  async init(): Promise<void> {
    const backups = await this.cacheService.keys('backup:*');

    for (const backup of backups) {
      const job = JSON.parse(await this.cacheService.get(backup, false));
      await this.scheduleBackup(job);
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

      try {
        await fs.access(binaryPath, constants.F_OK);

        try {
          await fs.access(binaryPath, constants.X_OK);
          results.push({
            binary,
            path: binaryPath,
            exists: true,
            executable: true,
            status: 'OK',
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

    return {
      platform: process.platform,
      architecture: process.arch,
      workingDirectory: process.cwd(),
      binaries: results,
    };
  }
}
