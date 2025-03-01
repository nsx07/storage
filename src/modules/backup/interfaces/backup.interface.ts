export interface BackupOptions {
  name: string;
  folder: string;
  connectionString: string;
  zip?: boolean;
  continuos?: boolean;
  cron?: string;
  command?: string;
  path?: string;
  key?: string;
}

export interface BackupResponse {
  message: string;
  status: 'success' | 'failed';
  error?: any;
}

export interface BackupJob {
  name: string;
  schedule: string;
  lastRun?: Date;
  nextRun?: any;
  status: 'active' | 'inactive';
}
