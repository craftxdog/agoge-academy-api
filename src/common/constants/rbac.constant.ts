export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const MODULES_KEY = 'modules';
export const SKIP_TENANT_KEY = 'skipTenant';

export const SYSTEM_MODULES = {
  settings: 'settings',
  users: 'users',
  billing: 'billing',
  schedules: 'schedules',
  notifications: 'notifications',
  audit: 'audit',
} as const;

export const SYSTEM_ROLES = {
  admin: 'admin',
  customer: 'customer',
} as const;

export const SYSTEM_PERMISSIONS = {
  settingsRead: 'settings.read',
  settingsWrite: 'settings.write',
  modulesManage: 'modules.manage',
  rolesManage: 'roles.manage',
  usersRead: 'users.read',
  usersWrite: 'users.write',
  billingRead: 'billing.read',
  billingWrite: 'billing.write',
  schedulesRead: 'schedules.read',
  schedulesWrite: 'schedules.write',
  notificationsRead: 'notifications.read',
  auditRead: 'audit.read',
} as const;

export type SystemModule = (typeof SYSTEM_MODULES)[keyof typeof SYSTEM_MODULES];
export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
export type SystemPermission =
  (typeof SYSTEM_PERMISSIONS)[keyof typeof SYSTEM_PERMISSIONS];

export type CustomModule = string & { readonly __customModule?: unique symbol };
export type CustomRole = string & { readonly __customRole?: unique symbol };
export type CustomPermission = string & {
  readonly __customPermission?: unique symbol;
};

export type ModuleKey = SystemModule | CustomModule;
export type RoleKey = SystemRole | CustomRole;
export type PermissionKey = SystemPermission | CustomPermission;
