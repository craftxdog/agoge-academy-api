import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantRequest } from '../interfaces/request-context.interface';
import { getCurrentUser } from '../utils/request-context.util';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    const user = getCurrentUser(request);

    return data ? user?.[data] : user;
  },
);
