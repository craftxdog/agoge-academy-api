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

export type SystemEndpointPermissionRuleDefinition = {
  method: string;
  pathPattern: string;
  permissionKeys: string[];
  description: string;
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
        key: 'users.members.create',
        name: 'Create members',
        description: 'Create or add tenant members without full user admin.',
      },
      {
        key: 'users.members.update',
        name: 'Update members',
        description: 'Update tenant member profile details.',
      },
      {
        key: 'users.members.status.manage',
        name: 'Manage member status',
        description: 'Suspend or reactivate tenant members.',
      },
      {
        key: 'users.members.remove',
        name: 'Remove members',
        description: 'Remove tenant members.',
      },
      {
        key: 'users.invitations.create',
        name: 'Create invitations',
        description: 'Create tenant invitations.',
      },
      {
        key: 'users.invitations.revoke',
        name: 'Revoke invitations',
        description: 'Revoke pending tenant invitations.',
      },
      {
        key: 'member.create',
        name: 'Create members alias',
        description:
          'Alias permission for creating or adding tenant members from custom role builders.',
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
        key: 'billing.cobros',
        name: 'Billing Cobros',
        description: 'View member payments and payment transactions.',
      },
      {
        key: 'billing.payment-types.manage',
        name: 'Manage payment concepts',
        description: 'Create, update or archive payment concepts.',
      },
      {
        key: 'billing.payment-methods.manage',
        name: 'Manage payment methods',
        description: 'Create, update or archive payment methods.',
      },
      {
        key: 'billing.payments.create',
        name: 'Create member payments',
        description: 'Create payments or charges for tenant members.',
      },
      {
        key: 'billing.payments.update',
        name: 'Update member payments',
        description:
          'Update payment lifecycle, due dates and payment metadata.',
      },
      {
        key: 'billing.transactions.create',
        name: 'Record payment transactions',
        description: 'Record payment transactions against member payments.',
      },
      {
        key: 'billing.stable',
        name: 'Billing Members',
        description:
          'Create member payments, record transactions and update member payment lifecycle without managing payment concepts or methods.',
      },
      {
        key: 'billing.catalog.manage',
        name: 'Manage billing catalog',
        description: 'Create, update or archive payment concepts and methods.',
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
        key: 'schedules.locations.manage',
        name: 'Manage schedule locations',
        description: 'Create, update or deactivate schedule locations.',
      },
      {
        key: 'schedules.business-hours.manage',
        name: 'Manage business hours',
        description: 'Create, replace, update or delete business hours.',
      },
      {
        key: 'schedules.exceptions.manage',
        name: 'Manage schedule exceptions',
        description: 'Create, update or delete schedule exceptions.',
      },
      {
        key: 'schedules.availability.manage',
        name: 'Manage member availability',
        description: 'Create, replace, update or delete member availability.',
      },
      {
        key: 'schedules.stable',
        name: 'Add schedules for users',
        description:
          'Create, replace, update and delete member availability without managing tenant locations, business hours or exceptions.',
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

export const SYSTEM_ENDPOINT_PERMISSION_RULES: SystemEndpointPermissionRuleDefinition[] =
  [
    {
      method: 'POST',
      pathPattern: '/users/members',
      permissionKeys: ['users.write', 'users.members.create', 'member.create'],
      description: 'Create or add a tenant member.',
    },
    {
      method: 'PATCH',
      pathPattern: '/users/members/:memberId',
      permissionKeys: ['users.write', 'users.members.update'],
      description: 'Update tenant member profile.',
    },
    {
      method: 'PATCH',
      pathPattern: '/users/members/:memberId/status',
      permissionKeys: ['users.write', 'users.members.status.manage'],
      description: 'Suspend or reactivate a tenant member.',
    },
    {
      method: 'DELETE',
      pathPattern: '/users/members/:memberId',
      permissionKeys: ['users.write', 'users.members.remove'],
      description: 'Remove a tenant member.',
    },
    {
      method: 'POST',
      pathPattern: '/users/invitations',
      permissionKeys: [
        'users.write',
        'users.invitations.create',
        'users.members.create',
        'member.create',
      ],
      description: 'Create a tenant invitation.',
    },
    {
      method: 'POST',
      pathPattern: '/users/invitations/:invitationId/revoke',
      permissionKeys: ['users.write', 'users.invitations.revoke'],
      description: 'Revoke a pending tenant invitation.',
    },
    {
      method: 'GET',
      pathPattern: '/billing/summary',
      permissionKeys: ['billing.read', 'billing.cobros'],
      description: 'View tenant billing summary.',
    },
    {
      method: 'GET',
      pathPattern: '/billing/payments',
      permissionKeys: ['billing.read', 'billing.cobros'],
      description: 'List tenant payments.',
    },
    {
      method: 'GET',
      pathPattern: '/billing/payments/:paymentId',
      permissionKeys: ['billing.read', 'billing.cobros'],
      description: 'View payment detail.',
    },
    {
      method: 'GET',
      pathPattern: '/billing/payments/:paymentId/transactions',
      permissionKeys: ['billing.read', 'billing.cobros'],
      description: 'List payment transactions.',
    },
    {
      method: 'POST',
      pathPattern: '/billing/payment-types',
      permissionKeys: [
        'billing.write',
        'billing.catalog.manage',
        'billing.payment-types.manage',
      ],
      description: 'Create a payment concept.',
    },
    {
      method: 'PATCH',
      pathPattern: '/billing/payment-types/:paymentTypeId',
      permissionKeys: [
        'billing.write',
        'billing.catalog.manage',
        'billing.payment-types.manage',
      ],
      description: 'Update a payment concept.',
    },
    {
      method: 'DELETE',
      pathPattern: '/billing/payment-types/:paymentTypeId',
      permissionKeys: [
        'billing.write',
        'billing.catalog.manage',
        'billing.payment-types.manage',
      ],
      description: 'Archive a payment concept.',
    },
    {
      method: 'POST',
      pathPattern: '/billing/payment-methods',
      permissionKeys: [
        'billing.write',
        'billing.catalog.manage',
        'billing.payment-methods.manage',
      ],
      description: 'Create a payment method.',
    },
    {
      method: 'PATCH',
      pathPattern: '/billing/payment-methods/:paymentMethodId',
      permissionKeys: [
        'billing.write',
        'billing.catalog.manage',
        'billing.payment-methods.manage',
      ],
      description: 'Update a payment method.',
    },
    {
      method: 'DELETE',
      pathPattern: '/billing/payment-methods/:paymentMethodId',
      permissionKeys: [
        'billing.write',
        'billing.catalog.manage',
        'billing.payment-methods.manage',
      ],
      description: 'Archive a payment method.',
    },
    {
      method: 'POST',
      pathPattern: '/billing/payments',
      permissionKeys: [
        'billing.write',
        'billing.payments.create',
        'billing.stable',
      ],
      description: 'Create a member payment.',
    },
    {
      method: 'PATCH',
      pathPattern: '/billing/payments/:paymentId',
      permissionKeys: [
        'billing.write',
        'billing.payments.update',
        'billing.stable',
      ],
      description: 'Update a member payment.',
    },
    {
      method: 'POST',
      pathPattern: '/billing/payments/:paymentId/transactions',
      permissionKeys: [
        'billing.write',
        'billing.transactions.create',
        'billing.stable',
      ],
      description: 'Record a payment transaction.',
    },
    {
      method: 'POST',
      pathPattern: '/schedules/locations',
      permissionKeys: ['schedules.write', 'schedules.locations.manage'],
      description: 'Create a schedule location.',
    },
    {
      method: 'PATCH',
      pathPattern: '/schedules/locations/:locationId',
      permissionKeys: ['schedules.write', 'schedules.locations.manage'],
      description: 'Update a schedule location.',
    },
    {
      method: 'DELETE',
      pathPattern: '/schedules/locations/:locationId',
      permissionKeys: ['schedules.write', 'schedules.locations.manage'],
      description: 'Delete or deactivate a schedule location.',
    },
    {
      method: 'POST',
      pathPattern: '/schedules/business-hours',
      permissionKeys: ['schedules.write', 'schedules.business-hours.manage'],
      description: 'Create a business-hour window.',
    },
    {
      method: 'PUT',
      pathPattern: '/schedules/business-hours',
      permissionKeys: ['schedules.write', 'schedules.business-hours.manage'],
      description: 'Replace business hours for one scope.',
    },
    {
      method: 'PATCH',
      pathPattern: '/schedules/business-hours/:businessHourId',
      permissionKeys: ['schedules.write', 'schedules.business-hours.manage'],
      description: 'Update a business-hour window.',
    },
    {
      method: 'DELETE',
      pathPattern: '/schedules/business-hours/:businessHourId',
      permissionKeys: ['schedules.write', 'schedules.business-hours.manage'],
      description: 'Delete a business-hour window.',
    },
    {
      method: 'POST',
      pathPattern: '/schedules/exceptions',
      permissionKeys: ['schedules.write', 'schedules.exceptions.manage'],
      description: 'Create a schedule exception.',
    },
    {
      method: 'PATCH',
      pathPattern: '/schedules/exceptions/:exceptionId',
      permissionKeys: ['schedules.write', 'schedules.exceptions.manage'],
      description: 'Update a schedule exception.',
    },
    {
      method: 'DELETE',
      pathPattern: '/schedules/exceptions/:exceptionId',
      permissionKeys: ['schedules.write', 'schedules.exceptions.manage'],
      description: 'Delete a schedule exception.',
    },
    {
      method: 'POST',
      pathPattern: '/schedules/members/:memberId/availability',
      permissionKeys: [
        'schedules.write',
        'schedules.availability.manage',
        'schedules.stable',
      ],
      description: 'Create member availability.',
    },
    {
      method: 'PUT',
      pathPattern: '/schedules/members/:memberId/availability',
      permissionKeys: [
        'schedules.write',
        'schedules.availability.manage',
        'schedules.stable',
      ],
      description: 'Replace member availability.',
    },
    {
      method: 'PATCH',
      pathPattern: '/schedules/availability/:scheduleId',
      permissionKeys: [
        'schedules.write',
        'schedules.availability.manage',
        'schedules.stable',
      ],
      description: 'Update one member availability window.',
    },
    {
      method: 'DELETE',
      pathPattern: '/schedules/availability/:scheduleId',
      permissionKeys: [
        'schedules.write',
        'schedules.availability.manage',
        'schedules.stable',
      ],
      description: 'Delete one member availability window.',
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
