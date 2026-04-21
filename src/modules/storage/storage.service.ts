import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { getStorageConfig } from '../../config';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
  StorageFile,
  UploadResult,
} from './interfaces/storage-provider.interface';

@Injectable()
export class StorageService {
  private readonly storageConfig = getStorageConfig();

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: IStorageProvider,
  ) {}

  async upload(
    file: StorageFile | undefined,
    folder?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.buffer || file.size <= 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    if (file.size > this.storageConfig.maxFileSizeBytes) {
      throw new BadRequestException(
        `File size exceeds the limit of ${this.storageConfig.maxFileSizeBytes / (1024 * 1024)}MB`,
      );
    }

    if (!this.storageConfig.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed`,
      );
    }

    return this.provider.upload(file, folder);
  }

  async delete(key: string | null | undefined): Promise<void> {
    if (!key) {
      return;
    }

    await this.provider.delete(key);
  }

  async getUrl(key: string): Promise<string> {
    return this.provider.getUrl(key);
  }
}
