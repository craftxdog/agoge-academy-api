import { SetMetadata } from '@nestjs/common';
import { SKIP_TENANT_KEY } from '../constants/rbac.constant';

export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
