import { ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TenantRequest } from '../interfaces';
import { extractBearerToken } from '../utils';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const token = extractBearerToken(request);

    if (!token) {
      return true;
    }

    return super.canActivate(context);
  }
}
