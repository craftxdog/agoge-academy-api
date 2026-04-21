import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import {
  InvitationStatus,
  MemberStatus,
  ModuleStatus,
  NotificationType,
  PaymentFrequency,
  PaymentStatus,
  PaymentTransactionStatus,
  PlatformRole,
  ScreenType,
  UserStatus,
} from '../generated/prisma/enums';
import { getDatabaseConfig } from '../src/config';

const pool = new Pool({
  connectionString: getDatabaseConfig().url,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const PASSWORD_PREFIX = 'scrypt';
const DEMO_PASSWORD = 'AgogeDemo2026!';
const DEMO_ORGANIZATION_SLUG = 'agoge-performance-club';
const DEMO_ORGANIZATION_NAME = 'Agoge Performance Club';
const DEMO_TIMEZONE = 'America/Managua';
const DEMO_LOCALE = 'es-NI';
const DEMO_CURRENCY = 'USD';

type SystemCatalogSeed = {
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

type DemoUserSeed = {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  documentId: string;
  address: string;
  roleKeys: string[];
  joinedAt: Date;
  isCustomer: boolean;
  defaultLocationKey: 'central' | 'annex';
  schedule: Array<{
    dayOfWeek: number;
    start: string;
    end: string;
  }>;
};

const SYSTEM_CATALOG: SystemCatalogSeed[] = [
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
        description: 'View payments and billing settings.',
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
        description: 'View schedules and business hours.',
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
        description: 'View notifications.',
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
          'View executive analytics dashboards and business insights.',
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
    ],
  },
];

const DEMO_USERS: DemoUserSeed[] = [
  {
    email: 'sofia.rios@agoge-demo.test',
    username: 'agoge-sofia-rios',
    firstName: 'Sofia',
    lastName: 'Rios',
    phone: '+505 8888 1001',
    documentId: 'NIC-001-2026',
    address: 'Carretera a Masaya, Managua',
    roleKeys: ['admin'],
    joinedAt: daysAgo(120),
    isCustomer: false,
    defaultLocationKey: 'central',
    schedule: [
      { dayOfWeek: 1, start: '07:00', end: '16:00' },
      { dayOfWeek: 2, start: '07:00', end: '16:00' },
      { dayOfWeek: 3, start: '07:00', end: '16:00' },
      { dayOfWeek: 4, start: '07:00', end: '16:00' },
      { dayOfWeek: 5, start: '07:00', end: '16:00' },
    ],
  },
  {
    email: 'luis.mena@agoge-demo.test',
    username: 'agoge-luis-mena',
    firstName: 'Luis',
    lastName: 'Mena',
    phone: '+505 8888 1002',
    documentId: 'NIC-002-2026',
    address: 'Km 11 Carretera Sur, Managua',
    roleKeys: ['receptionist'],
    joinedAt: daysAgo(96),
    isCustomer: false,
    defaultLocationKey: 'central',
    schedule: [
      { dayOfWeek: 1, start: '08:00', end: '17:00' },
      { dayOfWeek: 2, start: '08:00', end: '17:00' },
      { dayOfWeek: 3, start: '08:00', end: '17:00' },
      { dayOfWeek: 4, start: '08:00', end: '17:00' },
      { dayOfWeek: 5, start: '08:00', end: '17:00' },
      { dayOfWeek: 6, start: '08:00', end: '13:00' },
    ],
  },
  {
    email: 'mariana.cuadra@agoge-demo.test',
    username: 'agoge-mariana-cuadra',
    firstName: 'Mariana',
    lastName: 'Cuadra',
    phone: '+505 8888 1003',
    documentId: 'NIC-003-2026',
    address: 'Santo Domingo, Managua',
    roleKeys: ['coach'],
    joinedAt: daysAgo(88),
    isCustomer: false,
    defaultLocationKey: 'annex',
    schedule: [
      { dayOfWeek: 1, start: '09:00', end: '18:00' },
      { dayOfWeek: 2, start: '09:00', end: '18:00' },
      { dayOfWeek: 3, start: '09:00', end: '18:00' },
      { dayOfWeek: 4, start: '09:00', end: '18:00' },
      { dayOfWeek: 5, start: '09:00', end: '18:00' },
    ],
  },
  {
    email: 'carlos.leiva@agoge-demo.test',
    username: 'agoge-carlos-leiva',
    firstName: 'Carlos',
    lastName: 'Leiva',
    phone: '+505 8888 1004',
    documentId: 'NIC-004-2026',
    address: 'Las Colinas, Managua',
    roleKeys: ['receptionist'],
    joinedAt: daysAgo(74),
    isCustomer: false,
    defaultLocationKey: 'central',
    schedule: [
      { dayOfWeek: 1, start: '10:00', end: '18:00' },
      { dayOfWeek: 2, start: '10:00', end: '18:00' },
      { dayOfWeek: 3, start: '10:00', end: '18:00' },
      { dayOfWeek: 4, start: '10:00', end: '18:00' },
      { dayOfWeek: 5, start: '10:00', end: '18:00' },
    ],
  },
  {
    email: 'ana.garcia@agoge-demo.test',
    username: 'agoge-ana-garcia',
    firstName: 'Ana',
    lastName: 'Garcia',
    phone: '+505 8888 2001',
    documentId: 'CLI-001-2026',
    address: 'Altamira, Managua',
    roleKeys: ['customer'],
    joinedAt: daysAgo(64),
    isCustomer: true,
    defaultLocationKey: 'central',
    schedule: [
      { dayOfWeek: 1, start: '06:00', end: '07:00' },
      { dayOfWeek: 3, start: '06:00', end: '07:00' },
      { dayOfWeek: 5, start: '06:00', end: '07:00' },
    ],
  },
  {
    email: 'diego.martinez@agoge-demo.test',
    username: 'agoge-diego-martinez',
    firstName: 'Diego',
    lastName: 'Martinez',
    phone: '+505 8888 2002',
    documentId: 'CLI-002-2026',
    address: 'Villa Fontana, Managua',
    roleKeys: ['customer'],
    joinedAt: daysAgo(58),
    isCustomer: true,
    defaultLocationKey: 'central',
    schedule: [
      { dayOfWeek: 2, start: '18:00', end: '19:00' },
      { dayOfWeek: 4, start: '18:00', end: '19:00' },
      { dayOfWeek: 6, start: '09:00', end: '10:00' },
    ],
  },
  {
    email: 'elena.torres@agoge-demo.test',
    username: 'agoge-elena-torres',
    firstName: 'Elena',
    lastName: 'Torres',
    phone: '+505 8888 2003',
    documentId: 'CLI-003-2026',
    address: 'Ticuantepe, Managua',
    roleKeys: ['customer'],
    joinedAt: daysAgo(42),
    isCustomer: true,
    defaultLocationKey: 'annex',
    schedule: [
      { dayOfWeek: 1, start: '17:00', end: '18:00' },
      { dayOfWeek: 3, start: '17:00', end: '18:00' },
      { dayOfWeek: 5, start: '17:00', end: '18:00' },
    ],
  },
  {
    email: 'fernando.lopez@agoge-demo.test',
    username: 'agoge-fernando-lopez',
    firstName: 'Fernando',
    lastName: 'Lopez',
    phone: '+505 8888 2004',
    documentId: 'CLI-004-2026',
    address: 'Granada, Granada',
    roleKeys: ['customer'],
    joinedAt: daysAgo(35),
    isCustomer: true,
    defaultLocationKey: 'annex',
    schedule: [
      { dayOfWeek: 2, start: '07:00', end: '08:00' },
      { dayOfWeek: 4, start: '07:00', end: '08:00' },
      { dayOfWeek: 6, start: '10:00', end: '11:00' },
    ],
  },
  {
    email: 'gabriela.vargas@agoge-demo.test',
    username: 'agoge-gabriela-vargas',
    firstName: 'Gabriela',
    lastName: 'Vargas',
    phone: '+505 8888 2005',
    documentId: 'CLI-005-2026',
    address: 'Carazo, Diriamba',
    roleKeys: ['customer'],
    joinedAt: daysAgo(24),
    isCustomer: true,
    defaultLocationKey: 'central',
    schedule: [
      { dayOfWeek: 1, start: '19:00', end: '20:00' },
      { dayOfWeek: 3, start: '19:00', end: '20:00' },
      { dayOfWeek: 5, start: '19:00', end: '20:00' },
    ],
  },
  {
    email: 'hector.castillo@agoge-demo.test',
    username: 'agoge-hector-castillo',
    firstName: 'Hector',
    lastName: 'Castillo',
    phone: '+505 8888 2006',
    documentId: 'CLI-006-2026',
    address: 'Jinotepe, Carazo',
    roleKeys: ['customer'],
    joinedAt: daysAgo(18),
    isCustomer: true,
    defaultLocationKey: 'annex',
    schedule: [
      { dayOfWeek: 2, start: '06:00', end: '07:00' },
      { dayOfWeek: 4, start: '06:00', end: '07:00' },
      { dayOfWeek: 6, start: '08:00', end: '09:00' },
    ],
  },
];

const INVITATIONS = [
  {
    email: 'patricia.perez@agoge-demo.test',
    status: InvitationStatus.PENDING,
    expiresAt: daysFromNow(7),
    acceptedAt: null,
    revokedAt: null,
    createdAt: daysAgo(2),
  },
  {
    email: 'raul.blanco@agoge-demo.test',
    status: InvitationStatus.ACCEPTED,
    expiresAt: daysAgo(5),
    acceptedAt: daysAgo(4),
    revokedAt: null,
    createdAt: daysAgo(8),
  },
  {
    email: 'ximena.solis@agoge-demo.test',
    status: InvitationStatus.EXPIRED,
    expiresAt: daysAgo(1),
    acceptedAt: null,
    revokedAt: null,
    createdAt: daysAgo(11),
  },
];

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function timeOfDay(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function dateOnly(value: Date): Date {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  return `${PASSWORD_PREFIX}$${salt}$${derivedKey.toString('hex')}`;
}

async function ensureSystemCatalog() {
  for (const moduleSeed of SYSTEM_CATALOG) {
    const moduleRecord = await prisma.appModule.upsert({
      where: { key: moduleSeed.key },
      create: {
        key: moduleSeed.key,
        name: moduleSeed.name,
        description: moduleSeed.description,
        sortOrder: moduleSeed.sortOrder,
        status: ModuleStatus.ACTIVE,
      },
      update: {
        name: moduleSeed.name,
        description: moduleSeed.description,
        sortOrder: moduleSeed.sortOrder,
        status: ModuleStatus.ACTIVE,
      },
    });

    for (const permission of moduleSeed.permissions) {
      await prisma.permission.upsert({
        where: { key: permission.key },
        create: {
          moduleId: moduleRecord.id,
          key: permission.key,
          name: permission.name,
          description: permission.description,
        },
        update: {
          moduleId: moduleRecord.id,
          name: permission.name,
          description: permission.description,
        },
      });
    }

    for (const screen of moduleSeed.screens) {
      await prisma.appScreen.upsert({
        where: {
          moduleId_key: {
            moduleId: moduleRecord.id,
            key: screen.key,
          },
        },
        create: {
          moduleId: moduleRecord.id,
          key: screen.key,
          name: screen.name,
          path: screen.path,
          requiredPermissionKey: screen.requiredPermissionKey,
          sortOrder: screen.sortOrder,
        },
        update: {
          name: screen.name,
          path: screen.path,
          requiredPermissionKey: screen.requiredPermissionKey,
          sortOrder: screen.sortOrder,
        },
      });
    }
  }

  const [modules, permissions] = await Promise.all([
    prisma.appModule.findMany({
      orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
    }),
    prisma.permission.findMany({
      orderBy: [{ key: 'asc' }],
    }),
  ]);

  return {
    modules,
    permissions,
  };
}

async function recreateDemoOrganization() {
  const existingOrganization = await prisma.organization.findUnique({
    where: { slug: DEMO_ORGANIZATION_SLUG },
    select: { id: true },
  });

  if (existingOrganization) {
    await prisma.organization.delete({
      where: { id: existingOrganization.id },
    });
  }

  const systemCatalog = await ensureSystemCatalog();
  const appScreens = await prisma.appScreen.findMany({
    include: { module: true },
    orderBy: [
      { module: { sortOrder: 'asc' } },
      { sortOrder: 'asc' },
      { key: 'asc' },
    ],
  });

  const organization = await prisma.organization.create({
    data: {
      slug: DEMO_ORGANIZATION_SLUG,
      name: DEMO_ORGANIZATION_NAME,
      legalName: 'Agoge Performance Club S.A.',
      taxId: 'J0310000312001',
      timezone: DEMO_TIMEZONE,
      locale: DEMO_LOCALE,
      defaultCurrency: DEMO_CURRENCY,
    },
  });

  await prisma.organizationBranding.create({
    data: {
      organizationId: organization.id,
      logoUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      logoKey: 'demo/agoge-performance-club/logo',
      iconUrl: 'https://res.cloudinary.com/demo/image/upload/face_top.jpg',
      iconKey: 'demo/agoge-performance-club/icon',
      primaryColor: '#111827',
      secondaryColor: '#E11D48',
      accentColor: '#F59E0B',
      theme: {
        mode: 'light',
        fontFamily: 'Sora',
        surface: '#F8FAFC',
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.organizationSetting.createMany({
    data: [
      {
        organizationId: organization.id,
        namespace: 'billing',
        key: 'currency',
        value: DEMO_CURRENCY,
      },
      {
        organizationId: organization.id,
        namespace: 'billing',
        key: 'payment_day',
        value: 5,
      },
      {
        organizationId: organization.id,
        namespace: 'billing',
        key: 'allow_partial_payments',
        value: true,
      },
      {
        organizationId: organization.id,
        namespace: 'security',
        key: 'require_2fa_for_admins',
        value: false,
      },
      {
        organizationId: organization.id,
        namespace: 'notifications',
        key: 'email_reminders_enabled',
        value: true,
      },
      {
        organizationId: organization.id,
        namespace: 'operations',
        key: 'check_in_grace_minutes',
        value: 15,
      },
    ],
  });

  await prisma.organizationModule.createMany({
    data: systemCatalog.modules.map((module) => ({
      organizationId: organization.id,
      moduleId: module.id,
      isEnabled: true,
      sortOrder: module.sortOrder,
    })),
  });

  await prisma.organizationScreen.createMany({
    data: appScreens.map((screen) => ({
      organizationId: organization.id,
      appScreenId: screen.id,
      moduleId: screen.moduleId,
      key: `${screen.module.key}.${screen.key}`,
      title: screen.name,
      path: screen.path,
      type: ScreenType.SYSTEM,
      requiredPermissionKey: screen.requiredPermissionKey,
      sortOrder: screen.sortOrder,
      isVisible: true,
    })),
  });

  const locations = await createLocations(organization.id);
  await createBusinessHours(organization.id, locations);
  await createScheduleExceptions(organization.id, locations);

  const permissionIds = new Map(
    systemCatalog.permissions.map((permission) => [
      permission.key,
      permission.id,
    ]),
  );

  const roles = await createRoles(organization.id, permissionIds);
  const members = await createMembers(organization.id, roles, locations);
  await createInvitations(organization.id, members.adminMemberId);
  const billingCatalog = await createBillingCatalog(organization.id);
  await createPayments(
    organization.id,
    members.customerMembers,
    billingCatalog,
  );
  await createNotifications(organization.id, members.allMembers);
  await createAuditLogs(organization.id, members.allMembers, billingCatalog);

  return {
    organization,
    members,
    locations,
    billingCatalog,
  };
}

async function createLocations(organizationId: string) {
  const created = await Promise.all([
    prisma.location.create({
      data: {
        organizationId,
        name: 'Central Performance Hub',
        address: 'Galerias Santo Domingo, Managua',
        timezone: DEMO_TIMEZONE,
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        organizationId,
        name: 'Annex Strength Lab',
        address: 'Km 12 Carretera a Masaya, Managua',
        timezone: DEMO_TIMEZONE,
        isActive: true,
      },
    }),
  ]);

  return {
    central: created[0],
    annex: created[1],
  };
}

async function createBusinessHours(
  organizationId: string,
  locations: Awaited<ReturnType<typeof createLocations>>,
) {
  const locationHours = [
    {
      locationId: locations.central.id,
      hours: [
        [1, '05:30', '21:00'],
        [2, '05:30', '21:00'],
        [3, '05:30', '21:00'],
        [4, '05:30', '21:00'],
        [5, '05:30', '21:00'],
        [6, '07:00', '16:00'],
      ],
    },
    {
      locationId: locations.annex.id,
      hours: [
        [1, '06:00', '20:00'],
        [2, '06:00', '20:00'],
        [3, '06:00', '20:00'],
        [4, '06:00', '20:00'],
        [5, '06:00', '20:00'],
        [6, '08:00', '14:00'],
      ],
    },
  ] as const;

  for (const scope of locationHours) {
    for (const [dayOfWeek, start, end] of scope.hours) {
      await prisma.businessHour.create({
        data: {
          organizationId,
          locationId: scope.locationId,
          dayOfWeek,
          startTime: timeOfDay(start),
          endTime: timeOfDay(end),
          isClosed: false,
        },
      });
    }

    await prisma.businessHour.create({
      data: {
        organizationId,
        locationId: scope.locationId,
        dayOfWeek: 0,
        startTime: timeOfDay('00:00'),
        endTime: timeOfDay('00:00'),
        isClosed: true,
      },
    });
  }
}

async function createScheduleExceptions(
  organizationId: string,
  locations: Awaited<ReturnType<typeof createLocations>>,
) {
  await prisma.scheduleException.createMany({
    data: [
      {
        organizationId,
        locationId: locations.central.id,
        date: dateOnly(daysFromNow(4)),
        name: 'Mantenimiento de energia',
        startTime: timeOfDay('13:00'),
        endTime: timeOfDay('17:00'),
        isClosed: false,
      },
      {
        organizationId,
        locationId: locations.annex.id,
        date: dateOnly(daysFromNow(9)),
        name: 'Capacitacion interna',
        startTime: null,
        endTime: null,
        isClosed: true,
      },
    ],
  });
}

async function createRoles(
  organizationId: string,
  permissionIds: Map<string, string>,
) {
  const roleSeeds = [
    {
      key: 'admin',
      name: 'Admin',
      description: 'Full organization administration.',
      isSystem: true,
      isDefault: false,
      permissionKeys: Array.from(permissionIds.keys()),
    },
    {
      key: 'coach',
      name: 'Coach',
      description:
        'Operational staff for schedules, members and performance follow-up.',
      isSystem: false,
      isDefault: false,
      permissionKeys: [
        'users.read',
        'users.write',
        'billing.read',
        'schedules.read',
        'schedules.write',
        'notifications.read',
        'analytics.read',
      ],
    },
    {
      key: 'receptionist',
      name: 'Receptionist',
      description: 'Front-desk staff managing members, payments and inbox.',
      isSystem: false,
      isDefault: false,
      permissionKeys: [
        'users.read',
        'users.write',
        'billing.read',
        'billing.write',
        'schedules.read',
        'notifications.read',
        'analytics.read',
      ],
    },
    {
      key: 'customer',
      name: 'Customer',
      description: 'Default customer access.',
      isSystem: true,
      isDefault: true,
      permissionKeys: ['billing.read', 'schedules.read', 'notifications.read'],
    },
  ];

  const roleMap = new Map<string, { id: string; key: string }>();

  for (const roleSeed of roleSeeds) {
    const role = await prisma.role.create({
      data: {
        organizationId,
        key: roleSeed.key,
        name: roleSeed.name,
        description: roleSeed.description,
        isSystem: roleSeed.isSystem,
        isDefault: roleSeed.isDefault,
      },
    });

    await prisma.rolePermission.createMany({
      data: roleSeed.permissionKeys.map((permissionKey) => ({
        roleId: role.id,
        permissionId: permissionIds.get(permissionKey)!,
      })),
    });

    roleMap.set(role.key, { id: role.id, key: role.key });
  }

  return roleMap;
}

async function createMembers(
  organizationId: string,
  roles: Map<string, { id: string; key: string }>,
  locations: Awaited<ReturnType<typeof createLocations>>,
) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const allMembers: Array<{
    userId: string;
    memberId: string;
    email: string;
    firstName: string;
    lastName: string;
    isCustomer: boolean;
  }> = [];
  const customerMembers: Array<{
    userId: string;
    memberId: string;
    email: string;
    firstName: string;
    lastName: string;
  }> = [];
  let adminMemberId = '';

  for (const demoUser of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        username: demoUser.username,
        passwordHash,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        platformRole: PlatformRole.USER,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: demoUser.email,
        username: demoUser.username,
        passwordHash,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        platformRole: PlatformRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    const member = await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: user.id,
        status: MemberStatus.ACTIVE,
        phone: demoUser.phone,
        documentId: demoUser.documentId,
        address: demoUser.address,
        joinedAt: demoUser.joinedAt,
      },
    });

    await prisma.memberRole.createMany({
      data: demoUser.roleKeys.map((roleKey) => ({
        memberId: member.id,
        roleId: roles.get(roleKey)!.id,
      })),
    });

    for (const slot of demoUser.schedule) {
      await prisma.memberSchedule.create({
        data: {
          memberId: member.id,
          locationId:
            demoUser.defaultLocationKey === 'central'
              ? locations.central.id
              : locations.annex.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: timeOfDay(slot.start),
          endTime: timeOfDay(slot.end),
        },
      });
    }

    const memberView = {
      userId: user.id,
      memberId: member.id,
      email: demoUser.email,
      firstName: demoUser.firstName,
      lastName: demoUser.lastName,
      isCustomer: demoUser.isCustomer,
    };

    allMembers.push(memberView);

    if (demoUser.isCustomer) {
      customerMembers.push(memberView);
    }

    if (demoUser.roleKeys.includes('admin')) {
      adminMemberId = member.id;
    }
  }

  return {
    allMembers,
    customerMembers,
    adminMemberId,
  };
}

async function createInvitations(
  organizationId: string,
  adminMemberId: string,
) {
  for (const invitation of INVITATIONS) {
    const tokenHash = await hashPassword(
      `${invitation.email}:${invitation.status}`,
    );

    await prisma.invitation.create({
      data: {
        organizationId,
        invitedByMemberId: adminMemberId,
        email: invitation.email,
        status: invitation.status,
        tokenHash,
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
        revokedAt: invitation.revokedAt,
        createdAt: invitation.createdAt,
        updatedAt: invitation.acceptedAt ?? invitation.createdAt,
      },
    });
  }
}

async function createBillingCatalog(organizationId: string) {
  const paymentTypes = {
    monthlyMembership: await prisma.paymentType.create({
      data: {
        organizationId,
        key: 'monthly_membership',
        name: 'Monthly Membership',
        description: 'Recurring access fee for the performance club.',
        amount: '65.00',
        currency: DEMO_CURRENCY,
        frequency: PaymentFrequency.MONTHLY,
        isActive: true,
        config: {
          billingDay: 5,
          lateFeeAmount: 10,
        } as Prisma.InputJsonValue,
      },
    }),
    personalTraining: await prisma.paymentType.create({
      data: {
        organizationId,
        key: 'personal_training',
        name: 'Personal Training',
        description: 'Premium one-to-one coaching blocks.',
        amount: '120.00',
        currency: DEMO_CURRENCY,
        frequency: PaymentFrequency.ONE_TIME,
        isActive: true,
      },
    }),
    enrollmentFee: await prisma.paymentType.create({
      data: {
        organizationId,
        key: 'enrollment_fee',
        name: 'Enrollment Fee',
        description: 'Initial enrollment and onboarding fee.',
        amount: '35.00',
        currency: DEMO_CURRENCY,
        frequency: PaymentFrequency.ONE_TIME,
        isActive: true,
      },
    }),
  };

  const paymentMethods = {
    card: await prisma.paymentMethod.create({
      data: {
        organizationId,
        key: 'card',
        name: 'Card',
        description: 'Card-present and online card collections.',
        requiresReference: true,
        isActive: true,
        config: {
          gateway: 'cloud-terminal',
          acceptedBrands: ['visa', 'mastercard'],
        } as Prisma.InputJsonValue,
      },
    }),
    cash: await prisma.paymentMethod.create({
      data: {
        organizationId,
        key: 'cash',
        name: 'Cash',
        description: 'Front-desk cash payments.',
        requiresReference: false,
        isActive: true,
      },
    }),
    transfer: await prisma.paymentMethod.create({
      data: {
        organizationId,
        key: 'transfer',
        name: 'Transfer',
        description: 'Manual bank transfer verification.',
        requiresReference: true,
        isActive: true,
        config: {
          bankName: 'BAC',
          accountEnding: '1042',
        } as Prisma.InputJsonValue,
      },
    }),
  };

  return {
    paymentTypes,
    paymentMethods,
  };
}

async function createPayments(
  organizationId: string,
  customers: Awaited<ReturnType<typeof createMembers>>['customerMembers'],
  billingCatalog: Awaited<ReturnType<typeof createBillingCatalog>>,
) {
  const paymentSeeds = [
    {
      customerIndex: 0,
      invoiceNumber: 'APC-2026-0001',
      amount: '65.00',
      paymentTypeId: billingCatalog.paymentTypes.monthlyMembership.id,
      status: PaymentStatus.PAID,
      dueDate: daysAgo(12),
      paidAt: daysAgo(11),
      createdAt: daysAgo(18),
      notes: 'Membership renewed at front desk.',
      transactions: [
        {
          amount: '65.00',
          paymentMethodId: billingCatalog.paymentMethods.card.id,
          status: PaymentTransactionStatus.SUCCEEDED,
          reference: 'CARD-APC-0001',
          processedAt: daysAgo(11),
          createdAt: daysAgo(11),
        },
      ],
    },
    {
      customerIndex: 1,
      invoiceNumber: 'APC-2026-0002',
      amount: '65.00',
      paymentTypeId: billingCatalog.paymentTypes.monthlyMembership.id,
      status: PaymentStatus.PARTIALLY_PAID,
      dueDate: daysAgo(6),
      paidAt: null,
      createdAt: daysAgo(14),
      notes: 'Partial cash payment pending balance.',
      transactions: [
        {
          amount: '30.00',
          paymentMethodId: billingCatalog.paymentMethods.cash.id,
          status: PaymentTransactionStatus.SUCCEEDED,
          reference: null,
          processedAt: daysAgo(5),
          createdAt: daysAgo(5),
        },
      ],
    },
    {
      customerIndex: 2,
      invoiceNumber: 'APC-2026-0003',
      amount: '65.00',
      paymentTypeId: billingCatalog.paymentTypes.monthlyMembership.id,
      status: PaymentStatus.OVERDUE,
      dueDate: daysAgo(3),
      paidAt: null,
      createdAt: daysAgo(9),
      notes: 'Transfer failed and invoice is overdue.',
      transactions: [
        {
          amount: '65.00',
          paymentMethodId: billingCatalog.paymentMethods.transfer.id,
          status: PaymentTransactionStatus.FAILED,
          reference: 'TRF-APC-0003',
          processedAt: daysAgo(2),
          createdAt: daysAgo(2),
        },
      ],
    },
    {
      customerIndex: 3,
      invoiceNumber: 'APC-2026-0004',
      amount: '120.00',
      paymentTypeId: billingCatalog.paymentTypes.personalTraining.id,
      status: PaymentStatus.PAID,
      dueDate: daysAgo(8),
      paidAt: daysAgo(7),
      createdAt: daysAgo(10),
      notes: 'Private coaching package.',
      transactions: [
        {
          amount: '120.00',
          paymentMethodId: billingCatalog.paymentMethods.transfer.id,
          status: PaymentTransactionStatus.SUCCEEDED,
          reference: 'TRF-APC-0004',
          processedAt: daysAgo(7),
          createdAt: daysAgo(7),
        },
      ],
    },
    {
      customerIndex: 4,
      invoiceNumber: 'APC-2026-0005',
      amount: '35.00',
      paymentTypeId: billingCatalog.paymentTypes.enrollmentFee.id,
      status: PaymentStatus.PENDING,
      dueDate: daysFromNow(2),
      paidAt: null,
      createdAt: daysAgo(4),
      notes: 'Enrollment still pending at onboarding stage.',
      transactions: [],
    },
    {
      customerIndex: 5,
      invoiceNumber: 'APC-2026-0006',
      amount: '65.00',
      paymentTypeId: billingCatalog.paymentTypes.monthlyMembership.id,
      status: PaymentStatus.PAID,
      dueDate: daysAgo(1),
      paidAt: daysAgo(1),
      createdAt: daysAgo(3),
      notes: 'Monthly membership collected in cash.',
      transactions: [
        {
          amount: '65.00',
          paymentMethodId: billingCatalog.paymentMethods.cash.id,
          status: PaymentTransactionStatus.SUCCEEDED,
          reference: null,
          processedAt: daysAgo(1),
          createdAt: daysAgo(1),
        },
      ],
    },
    {
      customerIndex: 0,
      invoiceNumber: 'APC-2026-0007',
      amount: '120.00',
      paymentTypeId: billingCatalog.paymentTypes.personalTraining.id,
      status: PaymentStatus.PAID,
      dueDate: daysAgo(15),
      paidAt: daysAgo(14),
      createdAt: daysAgo(16),
      notes: 'Additional personal training package.',
      transactions: [
        {
          amount: '120.00',
          paymentMethodId: billingCatalog.paymentMethods.card.id,
          status: PaymentTransactionStatus.SUCCEEDED,
          reference: 'CARD-APC-0007',
          processedAt: daysAgo(14),
          createdAt: daysAgo(14),
        },
      ],
    },
  ];

  for (const paymentSeed of paymentSeeds) {
    const customer = customers[paymentSeed.customerIndex];
    const payment = await prisma.payment.create({
      data: {
        organizationId,
        memberId: customer.memberId,
        paymentTypeId: paymentSeed.paymentTypeId,
        invoiceNumber: paymentSeed.invoiceNumber,
        amount: paymentSeed.amount,
        currency: DEMO_CURRENCY,
        status: paymentSeed.status,
        dueDate: paymentSeed.dueDate,
        paidAt: paymentSeed.paidAt,
        periodMonth:
          paymentSeed.paymentTypeId ===
          billingCatalog.paymentTypes.monthlyMembership.id
            ? paymentSeed.dueDate.getUTCMonth() + 1
            : null,
        periodYear:
          paymentSeed.paymentTypeId ===
          billingCatalog.paymentTypes.monthlyMembership.id
            ? paymentSeed.dueDate.getUTCFullYear()
            : null,
        notes: paymentSeed.notes,
        metadata: {
          seededFor: customer.email,
        } as Prisma.InputJsonValue,
        createdAt: paymentSeed.createdAt,
        updatedAt: paymentSeed.paidAt ?? paymentSeed.createdAt,
      },
    });

    for (const transactionSeed of paymentSeed.transactions) {
      await prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          paymentMethodId: transactionSeed.paymentMethodId,
          amount: transactionSeed.amount,
          currency: DEMO_CURRENCY,
          status: transactionSeed.status,
          reference: transactionSeed.reference,
          processedAt: transactionSeed.processedAt,
          metadata: {
            channel: 'demo-seed',
          } as Prisma.InputJsonValue,
          createdAt: transactionSeed.createdAt,
          updatedAt: transactionSeed.processedAt ?? transactionSeed.createdAt,
        },
      });
    }
  }
}

async function createNotifications(
  organizationId: string,
  members: Awaited<ReturnType<typeof createMembers>>['allMembers'],
) {
  const [ana, diego, elena] = members.filter((member) => member.isCustomer);
  const sofia = members.find(
    (member) => member.email === 'sofia.rios@agoge-demo.test',
  )!;
  const luis = members.find(
    (member) => member.email === 'luis.mena@agoge-demo.test',
  )!;

  await prisma.notification.createMany({
    data: [
      {
        organizationId,
        userId: ana.userId,
        memberId: ana.memberId,
        type: NotificationType.PAYMENT_PAID,
        title: 'Pago aplicado',
        message: 'Tu membresia de abril fue marcada como pagada.',
        data: { channel: 'email' } as Prisma.InputJsonValue,
        isRead: true,
        createdAt: daysAgo(11),
        updatedAt: daysAgo(11),
      },
      {
        organizationId,
        userId: diego.userId,
        memberId: diego.memberId,
        type: NotificationType.PAYMENT_OVERDUE,
        title: 'Saldo pendiente',
        message: 'Tu pago mensual aun tiene saldo pendiente por cobrar.',
        data: { remainingAmount: 35 } as Prisma.InputJsonValue,
        isRead: false,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(4),
      },
      {
        organizationId,
        userId: elena.userId,
        memberId: elena.memberId,
        type: NotificationType.PAYMENT_OVERDUE,
        title: 'Pago vencido',
        message:
          'La transferencia reportada no fue confirmada y el cobro vencio.',
        data: { reference: 'TRF-APC-0003' } as Prisma.InputJsonValue,
        isRead: false,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
      {
        organizationId,
        userId: sofia.userId,
        memberId: sofia.memberId,
        type: NotificationType.MODULE_ENABLED,
        title: 'Analytics habilitado',
        message:
          'El dashboard ejecutivo ya esta disponible para la organizacion.',
        data: { module: 'analytics' } as Prisma.InputJsonValue,
        isRead: true,
        createdAt: daysAgo(20),
        updatedAt: daysAgo(20),
      },
      {
        organizationId,
        userId: luis.userId,
        memberId: luis.memberId,
        type: NotificationType.SYSTEM_MESSAGE,
        title: 'Revision operativa',
        message: 'Hay una excepcion de horario programada para esta semana.',
        data: { type: 'schedule_exception' } as Prisma.InputJsonValue,
        isRead: false,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
    ],
  });
}

async function createAuditLogs(
  organizationId: string,
  members: Awaited<ReturnType<typeof createMembers>>['allMembers'],
  billingCatalog: Awaited<ReturnType<typeof createBillingCatalog>>,
) {
  const sofia = members.find(
    (member) => member.email === 'sofia.rios@agoge-demo.test',
  )!;
  const luis = members.find(
    (member) => member.email === 'luis.mena@agoge-demo.test',
  )!;
  const mariana = members.find(
    (member) => member.email === 'mariana.cuadra@agoge-demo.test',
  )!;
  const ana = members.find(
    (member) => member.email === 'ana.garcia@agoge-demo.test',
  )!;

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId,
        actorUserId: sofia.userId,
        actorMemberId: sofia.memberId,
        action: 'organization.branding.updated',
        entityType: 'organization_branding',
        entityId: organizationId,
        before: Prisma.JsonNull,
        after: {
          primaryColor: '#111827',
          accentColor: '#F59E0B',
        } as Prisma.InputJsonValue,
        metadata: {
          source: 'demo-seed',
        } as Prisma.InputJsonValue,
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
        createdAt: daysAgo(21),
      },
      {
        organizationId,
        actorUserId: luis.userId,
        actorMemberId: luis.memberId,
        action: 'payment.created',
        entityType: 'payment',
        entityId: 'APC-2026-0005',
        before: Prisma.JsonNull,
        after: {
          paymentTypeKey: 'enrollment_fee',
          amount: '35.00',
        } as Prisma.InputJsonValue,
        metadata: {
          paymentMethodKeys: Object.keys(billingCatalog.paymentMethods),
        } as Prisma.InputJsonValue,
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
        createdAt: daysAgo(4),
      },
      {
        organizationId,
        actorUserId: mariana.userId,
        actorMemberId: mariana.memberId,
        action: 'schedule.member.assigned',
        entityType: 'member_schedule',
        entityId: ana.memberId,
        before: Prisma.JsonNull,
        after: {
          memberEmail: ana.email,
          slot: 'mon-wed-fri-06:00',
        } as Prisma.InputJsonValue,
        metadata: {
          location: 'central',
        } as Prisma.InputJsonValue,
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
        createdAt: daysAgo(12),
      },
      {
        organizationId,
        actorUserId: sofia.userId,
        actorMemberId: sofia.memberId,
        action: 'analytics.module.reviewed',
        entityType: 'organization_module',
        entityId: 'analytics',
        before: {
          enabled: false,
        } as Prisma.InputJsonValue,
        after: {
          enabled: true,
        } as Prisma.InputJsonValue,
        metadata: {
          module: 'analytics',
        } as Prisma.InputJsonValue,
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
        createdAt: daysAgo(19),
      },
    ],
  });
}

async function main() {
  const result = await recreateDemoOrganization();

  console.log('Demo seed completed successfully.');
  console.log(
    `Organization: ${result.organization.name} (${result.organization.slug})`,
  );
  console.log(`Shared password for demo users: ${DEMO_PASSWORD}`);
  console.log(`Members created: ${result.members.allMembers.length}`);
  console.log(`Customer members: ${result.members.customerMembers.length}`);
  console.log(
    `Locations: ${result.locations.central.name}, ${result.locations.annex.name}`,
  );
  console.log(
    `Payment methods: ${Object.keys(result.billingCatalog.paymentMethods).join(', ')}`,
  );
  console.log('Demo user emails:');

  for (const member of result.members.allMembers) {
    console.log(`- ${member.email}`);
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
