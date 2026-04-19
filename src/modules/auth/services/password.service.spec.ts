import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes and verifies a password', async () => {
    const hash = await service.hash('SaaS-ready-password-2026!');

    expect(hash).not.toBe('SaaS-ready-password-2026!');
    await expect(
      service.verify('SaaS-ready-password-2026!', hash),
    ).resolves.toBe(true);
  });

  it('rejects an invalid password', async () => {
    const hash = await service.hash('SaaS-ready-password-2026!');

    await expect(service.verify('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(
      service.verify('SaaS-ready-password-2026!', 'bad-hash'),
    ).resolves.toBe(false);
  });
});
