import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlatformRole, UserStatus } from 'generated/prisma/enums';
import { TenantRequest } from '../../../common';
import { AuditService } from './audit.service';

const now = new Date('2026-04-20T00:00:00.000Z');

const createUserRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-id',
  email: 'admin@agoge.com',
  username: 'admin',
  passwordHash: 'hash',
  firstName: 'Alex',
  lastName: 'Admin',
  platformRole: PlatformRole.USER,
  status: UserStatus.ACTIVE,
  refreshTokenHash: null,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const createMemberRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'member-id',
  organizationId: 'organization-id',
  userId: 'user-id',
  status: 'ACTIVE',
  phone: null,
  documentId: null,
  address: null,
  joinedAt: now,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
  user: createUserRecord(),
  ...overrides,
});

const createAuditRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'audit-id',
  organizationId: 'organization-id',
  actorUserId: 'user-id',
  actorMemberId: 'member-id',
  action: 'settings.organization.updated',
  entityType: 'organization',
  entityId: 'organization-id',
  before: { name: 'Old Name' },
  after: { name: 'New Name' },
  metadata: { requestId: 'request-id' },
  ipAddress: '127.0.0.1',
  userAgent: 'jest',
  createdAt: now,
  actorUser: createUserRecord(),
  actorMember: createMemberRecord(),
  ...overrides,
});

describe('AuditService', () => {
  const repository = {
    findAuditLogsPage: jest.fn(),
    findAuditLogById: jest.fn(),
    findEntityLogsPage: jest.fn(),
    findActorUserLogsPage: jest.fn(),
    findActorMemberLogsPage: jest.fn(),
    countLogs: jest.fn(),
    countByAction: jest.fn(),
    countByEntityType: jest.fn(),
    findRecentLogs: jest.fn(),
    findCatalog: jest.fn(),
    createAuditLog: jest.fn(),
  };
  let service: AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditService(repository as never);
  });

  it('rejects inverted date ranges', async () => {
    await expect(
      service.listLogs('organization-id', {
        dateFrom: '2026-04-30T00:00:00.000Z',
        dateTo: '2026-04-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.findAuditLogsPage).not.toHaveBeenCalled();
  });

  it('throws when audit log detail is missing', async () => {
    repository.findAuditLogById.mockResolvedValue(null);

    await expect(
      service.getLog('organization-id', 'audit-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps paginated audit logs', async () => {
    repository.findAuditLogsPage.mockResolvedValue({
      items: [createAuditRecord()],
      pagination: {
        strategy: 'cursor',
        limit: 50,
        count: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
        previousCursor: 'cursor',
        sortBy: 'createdAt',
        sortDirection: 'desc',
      },
    });

    const result = await service.listLogs('organization-id', {
      limit: 50,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });

    expect(result.items[0].actorUser?.email).toBe('admin@agoge.com');
    expect(result.items[0].actorMember?.user.email).toBe('admin@agoge.com');
    expect(result.message).toBe('Audit logs retrieved successfully');
  });

  it('records an audit log from request context', async () => {
    repository.createAuditLog.mockResolvedValue(createAuditRecord());
    const request = {
      requestId: 'request-id',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'jest',
      },
      organization: {
        id: 'organization-id',
        slug: 'agoge',
      },
      user: {
        id: 'user-id',
        email: 'admin@agoge.com',
      },
      member: {
        id: 'member-id',
        organizationId: 'organization-id',
        userId: 'user-id',
        roles: ['admin'],
        permissions: ['audit.read'],
        enabledModules: ['audit'],
      },
    } as TenantRequest;

    await service.recordFromRequest(request, {
      action: 'Settings.Organization.Updated',
      entityType: 'Organization',
      entityId: 'organization-id',
      metadata: { source: 'unit-test' },
    });

    expect(repository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'organization-id',
        actorUserId: 'user-id',
        actorMemberId: 'member-id',
        action: 'settings.organization.updated',
        entityType: 'organization',
        metadata: expect.objectContaining({
          requestId: 'request-id',
          source: 'unit-test',
        }),
      }),
    );
  });

  it('returns summary dimensions and recent events', async () => {
    repository.countLogs.mockResolvedValue(12);
    repository.countByAction.mockResolvedValue([
      { key: 'settings.organization.updated', count: 4 },
    ]);
    repository.countByEntityType.mockResolvedValue([
      { key: 'organization', count: 4 },
    ]);
    repository.findRecentLogs.mockResolvedValue([createAuditRecord()]);

    const result = await service.getSummary('organization-id', {});

    expect(result.totalEvents).toBe(12);
    expect(result.byAction[0].key).toBe('settings.organization.updated');
    expect(result.recentEvents).toHaveLength(1);
  });
});
