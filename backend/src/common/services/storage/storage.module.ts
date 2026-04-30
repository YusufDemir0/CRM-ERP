import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_SERVICE } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';

/**
 * StorageModule — Provides IStorageService based on STORAGE_PROVIDER env.
 * 
 * Usage:
 *   @Inject(STORAGE_SERVICE) private readonly storage: IStorageService
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('storage.provider') || 'local';

        if (provider === 's3') {
          return new S3StorageService(config);
        }

        return new LocalStorageService(config);
      },
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
