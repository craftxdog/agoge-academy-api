export type DatabaseConfig = {
  url: string;
};

export const DEFAULT_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/agoge?schema=public';

export const getDatabaseConfig = (): DatabaseConfig => ({
  url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
});
