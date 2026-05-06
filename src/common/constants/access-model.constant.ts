import { ModuleStatus } from '../../../generated/prisma/enums';
import {
  DEFAULT_CUSTOMER_PERMISSION_KEYS,
  SYSTEM_ROLES,
} from './rbac.constant';

export type SystemCatalogModuleDefinition = {
  key: string;
  name: string;
  description: string;
  sortOrder: number;
  permissions: Array<{
    key: string;
    name: string;
    description: string;
  }>;
  screens: Array<{
    key: string;
    name: string;
    path: string;
    requiredPermissionKey?: string;
    sortOrder: number;
  }>;
};

export type SystemRoleDefinition = {
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  isDefault: boolean;
  permissionKeys: string[];
};

export const SYSTEM_ACCESS_CATALOG: SystemCatalogModuleDefinition[] = [
  {
    key: 'settings',
    name: 'Settings',
    description: 'Company settings, branding, modules and permissions.',
    sortOrder: 10,
    permissions: [
      {
        key: 'settings.read',
        name: 'Read settings',
        description: 'View company settings.',
      },
      {
        key: 'settings.write',
        name: 'Write settings',
        description: 'Update company settings.',
      },
      {
        key: 'modules.manage',
        name: 'Manage modules',
        description: 'Enable modules and screens.',
      },
      {
        key: 'roles.manage',
        name: 'Manage roles',
        description: 'Create roles and assign permissions.',
      },
    ],
    screens: [
      {
        key: 'general',
        name: 'General Settings',
        path: '/settings/general',
        requiredPermissionKey: 'settings.read',
        sortOrder: 10,
      },
      {
        key: 'roles',
        name: 'Roles and Permissions',
        path: '/settings/roles',
        requiredPermissionKey: 'roles.manage',
        sortOrder: 20,
      },
      {
        key: 'modules',
        name: 'Modules and Screens',
        path: '/settings/modules',
        requiredPermissionKey: 'modules.manage',
        sortOrder: 30,
      },
    ],
  },
  {
    key: 'users',
    name: 'Users',
    description: 'Members, invitations and user administration.',
    sortOrder: 20,
    permissions: [
      {
        key: 'users.read',
        name: 'Read users',
        description: 'View members and invitations.',
      },
      {
        key: 'users.write',
        name: 'Write users',
        description: 'Create and update members.',
      },
    ],
    screens: [
      {
        key: 'members',
        name: 'Members',
        path: '/users/members',
        requiredPermissionKey: 'users.read',
        sortOrder: 10,
      },
    ],
  },
  {
    key: 'billing',
    name: 'Billing',
    description: 'Payment types, methods, invoices and transactions.',
    sortOrder: 30,
    permissions: [
      {
        key: 'billing.read',
        name: 'Read billing',
        description: 'View tenant payments, charges and billing settings.',
      },
      {
        key: 'billing.self.read',
        name: 'Read own billing',
        description: 'View personal payments and billing activity.',
      },
      {
        key: 'billing.write',
        name: 'Write billing',
        description: 'Create payments and update payment settings.',
      },
    ],
    screens: [
      {
        key: 'payments',
        name: 'Payments',
        path: '/billing/payments',
        requiredPermissionKey: 'billing.read',
        sortOrder: 10,
      },
      {
        key: 'my-payments',
        name: 'My Payments',
        path: '/billing/me/payments',
        requiredPermissionKey: 'billing.self.read',
        sortOrder: 15,
      },
      {
        key: 'payment-settings',
        name: 'Payment Settings',
        path: '/billing/settings',
        requiredPermissionKey: 'billing.write',
        sortOrder: 20,
      },
    ],
  },
  {
    key: 'schedules',
    name: 'Schedules',
    description: 'Business hours, exceptions and member schedules.',
    sortOrder: 40,
    permissions: [
      {
        key: 'schedules.read',
        name: 'Read schedules',
        description:
          'View organization schedules, locations, exceptions and member availability.',
      },
      {
        key: 'schedules.self.read',
        name: 'Read own schedules',
        description: 'View personal schedule availability.',
      },
      {
        key: 'schedules.write',
        name: 'Write schedules',
        description: 'Update schedules and business hours.',
      },
    ],
    screens: [
      {
        key: 'business-hours',
        name: 'Business Hours',
        path: '/schedules/business-hours',
        requiredPermissionKey: 'schedules.read',
        sortOrder: 10,
      },
      {
        key: 'my-availability',
        name: 'My Availability',
        path: '/schedules/me/availability',
        requiredPermissionKey: 'schedules.self.read',
        sortOrder: 15,
      },
    ],
  },
  {
    key: 'notifications',
    name: 'Notifications',
    description: 'Tenant-scoped notifications.',
    sortOrder: 50,
    permissions: [
      {
        key: 'notifications.read',
        name: 'Read notifications',
        description: 'View the shared tenant inbox.',
      },
      {
        key: 'notifications.self.read',
        name: 'Read own activity',
        description: 'View personal activity notifications.',
      },
    ],
    screens: [
      {
        key: 'inbox',
        name: 'Notifications',
        path: '/notifications',
        requiredPermissionKey: 'notifications.read',
        sortOrder: 10,
      },
      {
        key: 'activity',
        name: 'My Activity',
        path: '/activity',
        requiredPermissionKey: 'notifications.self.read',
        sortOrder: 15,
      },
    ],
  },
  {
    key: 'audit',
    name: 'Audit',
    description: 'Security and moderation activity trail.',
    sortOrder: 60,
    permissions: [
      {
        key: 'audit.read',
        name: 'Read audit logs',
        description: 'View audit logs and moderation trail.',
      },
    ],
    screens: [
      {
        key: 'activity',
        name: 'Activity',
        path: '/audit/activity',
        requiredPermissionKey: 'audit.read',
        sortOrder: 10,
      },
    ],
  },
  {
    key: 'analytics',
    name: 'Analytics',
    description:
      'Executive dashboards, revenue intelligence and operational insights.',
    sortOrder: 70,
    permissions: [
      {
        key: 'analytics.read',
        name: 'Read analytics',
        description:
          'View tenant-wide analytics dashboards and business insights.',
      },
      {
        key: 'analytics.self.read',
        name: 'Read own analytics',
        description:
          'View personal self-service analytics such as own balances, availability and activity.',
      },
    ],
    screens: [
      {
        key: 'dashboard',
        name: 'Analytics Dashboard',
        path: '/analytics/dashboard',
        requiredPermissionKey: 'analytics.read',
        sortOrder: 10,
      },
      {
        key: 'my-dashboard',
        name: 'My Dashboard',
        path: '/analytics/me/dashboard',
        requiredPermissionKey: 'analytics.self.read',
        sortOrder: 15,
      },
    ],
  },
];

export const SYSTEM_MODULE_STATUS = ModuleStatus.ACTIVE;

export function buildSystemRoleDefinitions(
  allPermissionKeys: string[],
): SystemRoleDefinition[] {
  return [
    {
      key: SYSTEM_ROLES.admin,
      name: 'Admin',
      description: 'Full organization administration.',
      isSystem: true,
      isDefault: false,
      permissionKeys: [...allPermissionKeys].sort(),
    },
    {
      key: SYSTEM_ROLES.customer,
      name: 'Customer',
      description: 'Default self-service customer access.',
      isSystem: true,
      isDefault: true,
      permissionKeys: [...DEFAULT_CUSTOMER_PERMISSION_KEYS].sort(),
    },
  ];
}
