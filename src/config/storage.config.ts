export type StorageProvider = 'local' | 's3';

export type StorageConfig = {
  provider: StorageProvider;
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
  local: {
    path: string;
  };
  s3: {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
  };
};

const DEFAULT_MAX_FILE_SIZE_MB = 10;

const resolveStorageProvider = (): StorageProvider =>
  process.env.STORAGE_PROVIDER === 's3' ? 's3' : 'local';

export const getStorageConfig = (): StorageConfig => ({
  provider: resolveStorageProvider(),
  maxFileSizeBytes:
    Number(process.env.MAX_FILE_SIZE_MB ?? DEFAULT_MAX_FILE_SIZE_MB) *
    1024 *
    1024,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
  local: {
    path: process.env.LOCAL_STORAGE_PATH ?? './uploads',
  },
  s3: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_S3_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_S3_KEY,
    bucket: process.env.AWS_S3_BUCKET,
  },
});
