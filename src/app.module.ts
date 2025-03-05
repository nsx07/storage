import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { StorageModule } from './modules/storage/storage.module';
import { BackupModule } from './modules/backup/backup.module';
import { CacheModule } from './modules/cache/cache.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    StorageModule,
    BackupModule,
    CacheModule,
  ],
})
export class AppModule {}
