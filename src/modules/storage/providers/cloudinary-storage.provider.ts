import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { buildKey } from '../../../common/utils';
import { getStorageConfig } from '../../../config';
import {
  IStorageProvider,
  StorageFile,
  UploadResult,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider {
  private readonly config = getStorageConfig();

  constructor() {
    const { cloudName, apiKey, apiSecret } = this.config.cloudinary;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary storage configuration is missing');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async upload(
    file: StorageFile,
    folder?: string,
  ): Promise<UploadResult> {
    const key = buildKey(
      file.originalname,
      [this.config.cloudinary.folder, folder].filter(Boolean).join('/'),
    );

    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: key,
          resource_type: 'auto',
          overwrite: false,
          unique_filename: false,
          use_filename: false,
        },
        (error, uploadResult) => {
          if (error) {
            reject(new InternalServerErrorException(error.message));
            return;
          }

          if (!uploadResult) {
            reject(new InternalServerErrorException('Upload failed'));
            return;
          }

          resolve(uploadResult);
        },
      );

      stream.end(file.buffer);
    });

    return {
      key: result.public_id,
      url: result.secure_url,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async delete(key: string): Promise<void> {
    const resourceTypes: Array<'image' | 'raw' | 'video'> = [
      'image',
      'raw',
      'video',
    ];
    let notFoundCount = 0;

    for (const resourceType of resourceTypes) {
      const result = await cloudinary.uploader.destroy(key, {
        invalidate: true,
        resource_type: resourceType,
      });

      if (result.result === 'ok') {
        return;
      }

      if (result.result === 'not found') {
        notFoundCount += 1;
      }
    }

    if (notFoundCount === resourceTypes.length) {
      return;
    }

    throw new InternalServerErrorException('Storage asset could not be deleted');
  }

  getUrl(key: string): string {
    return cloudinary.url(key, { secure: true });
  }
}
