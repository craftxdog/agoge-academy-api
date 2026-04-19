import { validateEnvSecret } from '../common/utils';

type JwtExpiresIn = `${number}${'s' | 'm' | 'h' | 'd'}` | `${number}` | number;

export type JwtConfig = {
  accessSecret: string;
  accessExpiresIn: JwtExpiresIn;
  refreshSecret: string;
  refreshExpiresIn: JwtExpiresIn;
};

const DEV_ACCESS_SECRET = 'development-access-secret-change-before-production';
const DEV_REFRESH_SECRET =
  'development-refresh-secret-change-before-production';

const resolveSecret = (name: string, fallback: string): string => {
  if (process.env.NODE_ENV === 'production') {
    return validateEnvSecret(name, process.env[name]);
  }

  const value = process.env[name];

  return value && value.length >= 32 ? value : fallback;
};

const resolveExpiresIn = (
  name: string,
  fallback: JwtExpiresIn,
): JwtExpiresIn => {
  const value = process.env[name];

  return value && /^\d+[smhd]?$/.test(value)
    ? (value as JwtExpiresIn)
    : fallback;
};

export const getJwtConfig = (): JwtConfig => ({
  accessSecret: resolveSecret('JWT_SECRET', DEV_ACCESS_SECRET),
  accessExpiresIn: resolveExpiresIn('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
  refreshSecret: resolveSecret('JWT_REFRESH_SECRET', DEV_REFRESH_SECRET),
  refreshExpiresIn: resolveExpiresIn('JWT_REFRESH_TOKEN_EXPIRES_IN', '7d'),
});
