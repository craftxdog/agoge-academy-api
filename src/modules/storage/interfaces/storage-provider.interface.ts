export const STORAGE_PROVIDER = Symbol('IStorageProvider');

export interface StorageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadResult {
  key: string;
  url: string;
  mimetype: string;
  size: number;
}

export interface IStorageProvider {
  upload(file: StorageFile, folder?: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string> | string;
}
