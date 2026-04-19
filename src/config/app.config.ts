import { parseCorsOrigins } from '../common/utils';

export const APP_NAME = 'Agoge Academy API';
export const API_DOCS_PATH = 'api/v1/docs';

export type AppConfig = {
  name: string;
  nodeEnv: string;
  port: number;
  frontendUrl?: string;
  corsOrigins: boolean | string[];
};

export const getPort = (): number => {
  const port = Number(process.env.PORT ?? 3000);

  return Number.isInteger(port) && port > 0 ? port : 3000;
};

export const getAppConfig = (): AppConfig => ({
  name: APP_NAME,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: getPort(),
  frontendUrl: process.env.FRONTEND_URL,
  corsOrigins: parseCorsOrigins(process.env.FRONTEND_URL),
});

export { parseCorsOrigins };
