import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantRequest } from '../interfaces/request-context.interface';
import {
  getCurrentMember,
  getCurrentOrganization,
  getCurrentUser,
  getRequestId,
} from '../utils/request-context.util';

export const CurrentTenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    const tenant = {
      requestId: getRequestId(request),
      user: getCurrentUser(request),
      organization: getCurrentOrganization(request),
      member: getCurrentMember(request),
    };

    return data ? tenant[data] : tenant;
  },
);
