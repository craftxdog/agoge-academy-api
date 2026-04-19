import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const PASSWORD_PREFIX = 'scrypt';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(
      password,
      salt,
      KEY_LENGTH,
    )) as Buffer;

    return `${PASSWORD_PREFIX}$${salt}$${derivedKey.toString('hex')}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [prefix, salt, key] = hash.split('$');

    if (prefix !== PASSWORD_PREFIX || !salt || !key) {
      return false;
    }

    const storedKey = Buffer.from(key, 'hex');
    const derivedKey = (await scryptAsync(
      password,
      salt,
      storedKey.length,
    )) as Buffer;

    return (
      storedKey.length === derivedKey.length &&
      timingSafeEqual(storedKey, derivedKey)
    );
  }
}
