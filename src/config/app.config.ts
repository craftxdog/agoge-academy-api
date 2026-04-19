import { parseCorsOrigins } from '../common/utils';

export const APP_NAME = 'Agoge Academy API';
export const API_DOCS_PATH = 'api/v1/docs';

export const getPort = (): number => {
  const port = Number(process.env.PORT ?? 3000);

  return Number.isInteger(port) && port > 0 ? port : 3000;
};

export { parseCorsOrigins };
