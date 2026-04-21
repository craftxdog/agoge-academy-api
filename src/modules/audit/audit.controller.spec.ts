import { AuditController } from './audit.controller';

describe('AuditController', () => {
  const auditService = {
    getSummary: jest.fn(),
    getCatalog: jest.fn(),
    listLogs: jest.fn(),
    getLog: jest.fn(),
    listEntityLogs: jest.fn(),
    listActorUserLogs: jest.fn(),
    listActorMemberLogs: jest.fn(),
  };
  let controller: AuditController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuditController(auditService as never);
  });

  it('delegates summary requests', async () => {
    const query = { dateFrom: '2026-04-01T00:00:00.000Z' };
    const response = { totalEvents: 5 };
    auditService.getSummary.mockResolvedValue(response);

    await expect(
      controller.getSummary('organization-id', query as never),
    ).resolves.toBe(response);
    expect(auditService.getSummary).toHaveBeenCalledWith(
      'organization-id',
      query,
    );
  });

  it('delegates catalog requests', async () => {
    const response = { actions: ['settings.updated'], entityTypes: ['setting'] };
    auditService.getCatalog.mockResolvedValue(response);

    await expect(controller.getCatalog('organization-id')).resolves.toBe(
      response,
    );
    expect(auditService.getCatalog).toHaveBeenCalledWith('organization-id');
  });

  it('delegates log list requests', async () => {
    const query = { search: 'settings' };
    const response = { items: [] };
    auditService.listLogs.mockResolvedValue(response);

    await expect(
      controller.listLogs('organization-id', query as never),
    ).resolves.toBe(response);
    expect(auditService.listLogs).toHaveBeenCalledWith('organization-id', query);
  });

  it('delegates log detail requests', async () => {
    const response = { id: 'audit-log-id' };
    auditService.getLog.mockResolvedValue(response);

    await expect(controller.getLog('organization-id', 'audit-log-id')).resolves.toBe(
      response,
    );
    expect(auditService.getLog).toHaveBeenCalledWith(
      'organization-id',
      'audit-log-id',
    );
  });

  it('delegates entity audit requests', async () => {
    const query = { action: 'users.member.updated' };
    const response = { items: [] };
    auditService.listEntityLogs.mockResolvedValue(response);

    await expect(
      controller.listEntityLogs(
        'organization-id',
        'organization_member',
        'entity-id',
        query as never,
      ),
    ).resolves.toBe(response);
    expect(auditService.listEntityLogs).toHaveBeenCalledWith(
      'organization-id',
      'organization_member',
      'entity-id',
      query,
    );
  });

  it('delegates actor user audit requests', async () => {
    const query = { action: 'billing.payment.created' };
    const response = { items: [] };
    auditService.listActorUserLogs.mockResolvedValue(response);

    await expect(
      controller.listActorUserLogs(
        'organization-id',
        'user-id',
        query as never,
      ),
    ).resolves.toBe(response);
    expect(auditService.listActorUserLogs).toHaveBeenCalledWith(
      'organization-id',
      'user-id',
      query,
    );
  });

  it('delegates actor member audit requests', async () => {
    const query = { action: 'billing.payment.created' };
    const response = { items: [] };
    auditService.listActorMemberLogs.mockResolvedValue(response);

    await expect(
      controller.listActorMemberLogs(
        'organization-id',
        'member-id',
        query as never,
      ),
    ).resolves.toBe(response);
    expect(auditService.listActorMemberLogs).toHaveBeenCalledWith(
      'organization-id',
      'member-id',
      query,
    );
  });
});
