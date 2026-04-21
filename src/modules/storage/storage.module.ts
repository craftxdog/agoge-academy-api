import { Module } from '@nestjs/common';
import { getStorageConfig } from '../../config';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from './interfaces/storage-provider.interface';
import { StorageService } from './storage.service';

const storageProviderFactory = (): IStorageProvider => {
  const storageConfig = getStorageConfig();

  switch (storageConfig.provider) {
    case 'cloudinary':
      return new CloudinaryStorageProvider();
    default:
      throw new Error(
        `Storage provider '${storageConfig.provider}' is not supported`,
      );
  }
};

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: storageProviderFactory,
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
