import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantRequest } from '../interfaces/request-context.interface';
import {
  getCurrentOrganization,
  getOrganizationId,
  getOrganizationSlug,
} from '../utils/request-context.util';

export const CurrentOrganization = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    const organization = getCurrentOrganization(request);

    if (data === 'id') {
      return organization?.id ?? getOrganizationId(request);
    }

    if (data === 'slug') {
      return organization?.slug ?? getOrganizationSlug(request);
    }

    return data ? organization?.[data] : organization;
  },
);
