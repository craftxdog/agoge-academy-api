import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantRequest } from '../interfaces/request-context.interface';
import { getCurrentMember, getMemberId } from '../utils/request-context.util';

export const CurrentMember = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    const member = getCurrentMember(request);

    if (data === 'id') {
      return member?.id ?? getMemberId(request);
    }

    return data ? member?.[data] : member;
  },
);
