import { Module, Global } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { CacheFactory } from './services/cache.factory';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CacheService, CacheFactory],
  exports: [CacheService],
})
export class CacheModule {}
