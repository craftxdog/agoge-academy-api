export const APP_NAME = 'Agoge Academy API';
export const API_DOCS_PATH = 'api/v1/docs';

export const getPort = (): number => {
  const port = Number(process.env.PORT ?? 3000);

  return Number.isInteger(port) && port > 0 ? port : 3000;
};

export const parseCorsOrigins = (value?: string): boolean | string[] => {
  if (!value) {
    return process.env.NODE_ENV === 'production' ? false : true;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};
