import {
  AUTHORIZATION_HEADER,
  BEARER_TOKEN_PREFIX,
} from '../constants/auth.constant';
import { TenantRequest } from '../interfaces';

export const extractBearerToken = (
  request: Pick<TenantRequest, 'headers'>,
): string | undefined => {
  const header = request.headers[AUTHORIZATION_HEADER];
  const authorization = Array.isArray(header) ? header[0] : header;

  if (!authorization?.startsWith(BEARER_TOKEN_PREFIX)) {
    return undefined;
  }

  return authorization.slice(BEARER_TOKEN_PREFIX.length).trim();
};
