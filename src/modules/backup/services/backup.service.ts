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
import { CronJob } from 'cron';

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

  async backup(
    payload: BackupOptions,
    update = false,
  ): Promise<BackupResponse> {
    try {
      if (!payload.name || !payload.folder || !payload.connectionString) {
        throw new Error('name, folder and connectionString are required');
      }

      payload.name = payload.name.substring(payload.name.lastIndexOf('.'));
      const backupPath = `${this.wwwroot}/backup/${payload.folder}/${payload.name}`;

      // Verifica se já existe um job agendado
      if (this.schedulerRegistry.getCronJobs().has(payload.name) && !update) {
        this.logger.log(`${payload.name} already exists, executing now`);
        this.schedulerRegistry.getCronJobs().get(payload.name)?.fireOnTick();

        return {
          message:
            'backup already scheduled, executed right now and on schedule time too.',
          status: 'success',
        };
      }

      // Cria diretórios necessários
      await this.storageService.createDirectory(`backup/${payload.folder}`);

      const command = `pg_dump ${payload.zip ? '-F t' : ''} --dbname=${payload.connectionString} >> ${backupPath}`;

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

      const command = `pg_restore -F t --no-privileges --no-owner --dbname=${payload.connectionString} ${backupPath}`;
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
      if (!payload.schedule) {
        throw new Error('Schedule is required for continuous backup');
      }

      const job = new CronJob(payload.schedule, async () => {
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
      const jobKey = `job:${name}`;
      const taskKey = `backup:${name}`;

      this.schedulerRegistry.deleteCronJob(jobKey);
      await this.cacheService.del(taskKey);

      return {
        message: 'backup job removed successfully',
        status: 'success',
      };
    } catch (error) {
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
      });
    }

    return backups;
  }

  private async saveLog(
    message: string,
    stdout: string,
    stderr: string,
    command: string,
  ): Promise<void> {
    const date = new Date().toISOString();
    const logContent = `
      [${date}] ${message}
      [${date}] command: ${command}
      ===============OUTPUT START================
      [${date}] stdout: ${stdout}
      [${date}] stderr: ${stderr}
      ===============OUTPUT END =================
    `;

    await this.storageService.log(
      `backup/logs/${date.split('T')[0]}_log`,
      logContent,
    );
  }

  parseJobName(name: string): string {
    return `job:${name}`;
  }

  parseTaskName(name: string): string {
    return `backup:${name}`;
  }
}
