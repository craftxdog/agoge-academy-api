export type StorageProvider = 'cloudinary';

export type StorageConfig = {
  provider: StorageProvider;
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
  cloudinary: {
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
    folder: string;
  };
};

const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_STORAGE_FOLDER = 'agoge';

const resolveMaxFileSizeBytes = (): number => {
  const sizeInMb = Number.parseInt(
    process.env.MAX_FILE_SIZE_MB ?? String(DEFAULT_MAX_FILE_SIZE_MB),
    10,
  );

  const safeSizeInMb =
    Number.isFinite(sizeInMb) && sizeInMb > 0
      ? sizeInMb
      : DEFAULT_MAX_FILE_SIZE_MB;

  return safeSizeInMb * 1024 * 1024;
};

const resolveStorageProvider = (): StorageProvider =>
  process.env.STORAGE_PROVIDER?.trim().toLowerCase() === 'cloudinary'
    ? 'cloudinary'
    : 'cloudinary';

export const getStorageConfig = (): StorageConfig => ({
  provider: resolveStorageProvider(),
  maxFileSizeBytes: resolveMaxFileSizeBytes(),
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER?.trim() || DEFAULT_STORAGE_FOLDER,
  },
});
