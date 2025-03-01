import { Module, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupController } from './controllers/backup.controller';
import { BackupService } from './services/backup.service';
import { StorageModule } from '../storage/storage.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ScheduleModule.forRoot(), StorageModule, CacheModule],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule implements OnModuleInit {
  constructor(private readonly backupService: BackupService) {}

  onModuleInit() {
    this.backupService.init();
  }
}
