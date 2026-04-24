import { Module } from '@nestjs/common';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from './interfaces/storage-provider.interface';
import { StorageService } from './storage.service';

const storageProviderFactory = (): IStorageProvider =>
  new CloudinaryStorageProvider();

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
