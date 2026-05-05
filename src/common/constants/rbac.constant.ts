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
  analytics: 'analytics',
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
  billingSelfRead: 'billing.self.read',
  billingWrite: 'billing.write',
  schedulesRead: 'schedules.read',
  schedulesSelfRead: 'schedules.self.read',
  schedulesWrite: 'schedules.write',
  notificationsRead: 'notifications.read',
  notificationsSelfRead: 'notifications.self.read',
  auditRead: 'audit.read',
  analyticsRead: 'analytics.read',
  analyticsSelfRead: 'analytics.self.read',
} as const;

export const DEFAULT_CUSTOMER_PERMISSION_KEYS = [
  SYSTEM_PERMISSIONS.billingSelfRead,
  SYSTEM_PERMISSIONS.schedulesSelfRead,
  SYSTEM_PERMISSIONS.notificationsSelfRead,
  SYSTEM_PERMISSIONS.analyticsSelfRead,
] as const;

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
