import { BadRequestException } from '@nestjs/common';
import {
  InvitationStatus,
  MemberStatus,
  PaymentStatus,
  PaymentTransactionStatus,
} from 'generated/prisma/enums';
import { AnalyticsService } from './analytics.service';

const decimal = (value: number) =>
  ({
    toString: () => value.toFixed(2),
    valueOf: () => value,
  }) as never;

describe('AnalyticsService', () => {
  const repository = {
    findPaymentsCreatedBetween: jest.fn(),
    findOpenPaymentsUntil: jest.fn(),
    findTransactionsProcessedBetween: jest.fn(),
    findMembers: jest.fn(),
    findInvitationsCreatedBetween: jest.fn(),
    countPendingInvitations: jest.fn(),
    countLocations: jest.fn(),
    countActiveLocations: jest.fn(),
    countBusinessHourWindows: jest.fn(),
    countMemberScheduleWindows: jest.fn(),
    countScheduledMembers: jest.fn(),
    countUnreadNotifications: jest.fn(),
    findRecentNotifications: jest.fn(),
    countUpcomingExceptions: jest.fn(),
    countAuditEventsBetween: jest.fn(),
    findAuditActionsBetween: jest.fn(),
    findEnabledModules: jest.fn(),
    findPaymentTypesCatalog: jest.fn(),
    findPaymentMethodsCatalog: jest.fn(),
    findLocationsCatalog: jest.fn(),
    findCurrenciesCatalog: jest.fn(),
  };
  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService(repository as never);
  });

  it('builds a dashboard with actionable insights', async () => {
    repository.findPaymentsCreatedBetween.mockResolvedValue([
      {
        id: 'payment-1',
        amount: decimal(1000),
        status: PaymentStatus.PENDING,
        createdAt: new Date('2026-04-10T12:00:00.000Z'),
        dueDate: new Date('2026-04-15T12:00:00.000Z'),
        paymentType: { id: 'type-1', key: 'membership', name: 'Membership' },
        transactions: [
          { amount: decimal(200), status: PaymentTransactionStatus.SUCCEEDED },
        ],
      },
    ]);
    repository.findOpenPaymentsUntil.mockResolvedValue([
      {
        id: 'payment-1',
        amount: decimal(1000),
        status: PaymentStatus.OVERDUE,
        createdAt: new Date('2026-04-10T12:00:00.000Z'),
        dueDate: new Date('2026-04-15T12:00:00.000Z'),
        paymentType: { id: 'type-1', key: 'membership', name: 'Membership' },
        transactions: [
          { amount: decimal(200), status: PaymentTransactionStatus.SUCCEEDED },
        ],
      },
    ]);
    repository.findTransactionsProcessedBetween.mockResolvedValue([
      {
        id: 'tx-1',
        amount: decimal(200),
        status: PaymentTransactionStatus.SUCCEEDED,
        processedAt: new Date('2026-04-12T12:00:00.000Z'),
        createdAt: new Date('2026-04-12T12:00:00.000Z'),
        paymentMethod: { id: 'method-1', key: 'cash', name: 'Cash' },
      },
    ]);
    repository.findMembers.mockResolvedValue([
      {
        id: 'member-1',
        status: MemberStatus.ACTIVE,
        joinedAt: new Date('2026-04-11T12:00:00.000Z'),
        deletedAt: null,
      },
      {
        id: 'member-2',
        status: MemberStatus.ACTIVE,
        joinedAt: new Date('2026-03-01T12:00:00.000Z'),
        deletedAt: null,
      },
      {
        id: 'member-3',
        status: MemberStatus.SUSPENDED,
        joinedAt: new Date('2026-02-01T12:00:00.000Z'),
        deletedAt: null,
      },
    ]);
    repository.findInvitationsCreatedBetween.mockResolvedValue([
      {
        id: 'inv-1',
        status: InvitationStatus.PENDING,
        createdAt: new Date('2026-04-13T12:00:00.000Z'),
      },
      {
        id: 'inv-2',
        status: InvitationStatus.ACCEPTED,
        createdAt: new Date('2026-04-14T12:00:00.000Z'),
      },
    ]);
    repository.countPendingInvitations.mockResolvedValue(3);
    repository.countLocations.mockResolvedValue(2);
    repository.countActiveLocations.mockResolvedValue(1);
    repository.countBusinessHourWindows.mockResolvedValue(14);
    repository.countMemberScheduleWindows.mockResolvedValue(8);
    repository.countScheduledMembers.mockResolvedValue(1);
    repository.countUnreadNotifications.mockResolvedValue(22);
    repository.findRecentNotifications.mockResolvedValue([
      {
        id: 'notification-1',
        type: 'PAYMENT_CREATED',
        title: 'Payment created',
        message: 'Invoice INV-202604-000001 was created.',
        isRead: false,
        createdAt: new Date('2026-04-20T12:00:00.000Z'),
      },
    ]);
    repository.countUpcomingExceptions.mockResolvedValue(2);
    repository.countAuditEventsBetween.mockResolvedValue(55);
    repository.findAuditActionsBetween.mockResolvedValue([
      { action: 'billing.payment.created' },
      { action: 'billing.payment.created' },
      { action: 'billing.payment.created' },
    ]);
    repository.findEnabledModules.mockResolvedValue([
      { key: 'settings' },
      { key: 'users' },
      { key: 'analytics' },
    ]);

    const result = await service.getDashboard('organization-id', {
      dateFrom: '2026-04-01T00:00:00.000Z',
      dateTo: '2026-04-30T23:59:59.999Z',
      groupBy: 'day',
      top: 5,
    });

    expect(result.revenue.invoiced.amount).toBe(1000);
    expect(result.revenue.collected.amount).toBe(200);
    expect(result.revenue.outstanding.amount).toBe(800);
    expect(result.members.currentMembers).toBe(3);
    expect(result.operations.enabledModules).toEqual([
      'settings',
      'users',
      'analytics',
    ]);
    expect(result.operations.recentNotifications).toHaveLength(1);
    expect(
      result.insights.some((item) => item.metricKey === 'overdueAmount'),
    ).toBe(true);
    expect(
      result.insights.some((item) => item.metricKey === 'unreadNotifications'),
    ).toBe(true);
  });

  it('rejects inverted date ranges', async () => {
    await expect(
      service.getRevenue('organization-id', {
        dateFrom: '2026-05-01T00:00:00.000Z',
        dateTo: '2026-04-01T00:00:00.000Z',
        groupBy: 'day',
        top: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
