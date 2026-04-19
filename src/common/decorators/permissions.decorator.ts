import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY, PermissionKey } from '../constants/rbac.constant';

export const Permissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
