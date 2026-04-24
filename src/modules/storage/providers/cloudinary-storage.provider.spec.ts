import { ServiceUnavailableException } from '@nestjs/common';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';

describe('CloudinaryStorageProvider', () => {
  const originalEnv = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };

  beforeEach(() => {
    process.env.CLOUDINARY_CLOUD_NAME = '';
    process.env.CLOUDINARY_API_KEY = '';
    process.env.CLOUDINARY_API_SECRET = '';
  });

  afterAll(() => {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.cloudName;
    process.env.CLOUDINARY_API_KEY = originalEnv.apiKey;
    process.env.CLOUDINARY_API_SECRET = originalEnv.apiSecret;
  });

  it('does not fail during construction when cloudinary credentials are absent', () => {
    expect(() => new CloudinaryStorageProvider()).not.toThrow();
  });

  it('fails only when an upload is attempted without configuration', async () => {
    const provider = new CloudinaryStorageProvider();

    await expect(
      provider.upload({
        originalname: 'logo.png',
        mimetype: 'image/png',
        size: 10,
        buffer: Buffer.from('demo'),
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('fails when generating a URL without configuration', () => {
    const provider = new CloudinaryStorageProvider();

    expect(() => provider.getUrl('branding/logo')).toThrow(
      ServiceUnavailableException,
    );
  });
});
