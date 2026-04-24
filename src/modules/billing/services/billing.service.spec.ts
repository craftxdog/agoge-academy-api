import { BadRequestException } from '@nestjs/common';
import {
  PaymentFrequency,
  PaymentStatus,
  PaymentTransactionStatus,
} from 'generated/prisma/enums';
import { BillingService } from './billing.service';

const money = (value: string) => ({
  toString: () => value,
});

const now = new Date('2026-04-20T00:00:00.000Z');

const createPaymentTypeRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'payment-type-id',
  organizationId: 'organization-id',
  key: 'monthly-membership',
  name: 'Monthly Membership',
  description: null,
  amount: money('45.00'),
  currency: 'NIO',
  frequency: PaymentFrequency.MONTHLY,
  isActive: true,
  config: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const createPaymentMethodRecord = (
  overrides: Record<string, unknown> = {},
) => ({
  id: 'payment-method-id',
  organizationId: 'organization-id',
  key: 'bank-transfer',
  name: 'Bank Transfer',
  description: null,
  requiresReference: true,
  isActive: true,
  config: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const createMemberRecord = () => ({
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
  user: {
    id: 'user-id',
    email: 'athlete@agoge.com',
    username: 'athlete',
    passwordHash: 'hash',
    firstName: 'Alex',
    lastName: 'Athlete',
    platformRole: 'USER',
    status: 'ACTIVE',
    refreshTokenHash: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  },
});

const createTransactionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'transaction-id',
  paymentId: 'payment-id',
  paymentMethodId: 'payment-method-id',
  amount: money('45.00'),
  currency: 'NIO',
  status: PaymentTransactionStatus.SUCCEEDED,
  reference: 'BAC-123456',
  processedAt: now,
  metadata: null,
  createdAt: now,
  updatedAt: now,
  paymentMethod: createPaymentMethodRecord({ requiresReference: false }),
  ...overrides,
});

const createPaymentRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'payment-id',
  organizationId: 'organization-id',
  memberId: 'member-id',
  paymentTypeId: 'payment-type-id',
  invoiceNumber: 'INV-202604-000001',
  amount: money('45.00'),
  currency: 'NIO',
  status: PaymentStatus.PENDING,
  dueDate: new Date('2026-04-30T00:00:00.000Z'),
  paidAt: null,
  periodMonth: 4,
  periodYear: 2026,
  notes: null,
  metadata: null,
  createdAt: now,
  updatedAt: now,
  member: createMemberRecord(),
  paymentType: createPaymentTypeRecord(),
  transactions: [],
  ...overrides,
});

describe('BillingService', () => {
  const repository = {
    findPaymentTypes: jest.fn(),
    findPaymentTypeById: jest.fn(),
    findPaymentTypeByKey: jest.fn(),
    createPaymentType: jest.fn(),
    updatePaymentType: jest.fn(),
    paymentTypeHasPayments: jest.fn(),
    deletePaymentType: jest.fn(),
    findPaymentMethods: jest.fn(),
    findPaymentMethodById: jest.fn(),
    findPaymentMethodByKey: jest.fn(),
    createPaymentMethod: jest.fn(),
    updatePaymentMethod: jest.fn(),
    paymentMethodHasTransactions: jest.fn(),
    deletePaymentMethod: jest.fn(),
    findMember: jest.fn(),
    findPaymentsPage: jest.fn(),
    findPaymentById: jest.fn(),
    createPayment: jest.fn(),
    updatePayment: jest.fn(),
    createTransaction: jest.fn(),
    findTransactions: jest.fn(),
    findOpenPayments: jest.fn(),
    findPaidPaymentsSince: jest.fn(),
  };
  const realtimeService = {
    publishOrganizationEvent: jest.fn(),
  };
  let service: BillingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BillingService(repository as never, realtimeService as never);
  });

  it('requires amount when no payment type default exists', async () => {
    repository.findMember.mockResolvedValue(createMemberRecord());
    repository.findPaymentTypeById.mockResolvedValue(
      createPaymentTypeRecord({ amount: null }),
    );

    await expect(
      service.createPayment('organization-id', {
        memberId: 'member-id',
        paymentTypeId: 'payment-type-id',
        dueDate: '2026-04-30',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.createPayment).not.toHaveBeenCalled();
  });

  it('requires reference when payment method is configured that way', async () => {
    repository.findPaymentById.mockResolvedValue(createPaymentRecord());
    repository.findPaymentMethodById.mockResolvedValue(
      createPaymentMethodRecord(),
    );

    await expect(
      service.createTransaction('organization-id', 'payment-id', {
        paymentMethodId: 'payment-method-id',
        amount: '45.00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.createTransaction).not.toHaveBeenCalled();
  });

  it('prevents transactions on cancelled or refunded payments', async () => {
    repository.findPaymentById.mockResolvedValue(
      createPaymentRecord({ status: PaymentStatus.CANCELLED }),
    );

    await expect(
      service.createTransaction('organization-id', 'payment-id', {
        amount: '45.00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.findPaymentMethodById).not.toHaveBeenCalled();
    expect(repository.createTransaction).not.toHaveBeenCalled();
  });

  it('marks payment as paid when successful transactions cover the balance', async () => {
    repository.findPaymentById
      .mockResolvedValueOnce(createPaymentRecord())
      .mockResolvedValueOnce(
        createPaymentRecord({
          transactions: [createTransactionRecord()],
        }),
      );
    repository.findPaymentMethodById.mockResolvedValue(
      createPaymentMethodRecord({ requiresReference: false }),
    );
    repository.createTransaction.mockResolvedValue(createTransactionRecord());
    repository.updatePayment.mockResolvedValue(
      createPaymentRecord({
        status: PaymentStatus.PAID,
        paidAt: now,
        transactions: [createTransactionRecord()],
      }),
    );

    const result = await service.createTransaction(
      'organization-id',
      'payment-id',
      {
        paymentMethodId: 'payment-method-id',
        amount: '45.00',
      },
    );

    expect(repository.updatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'payment-id',
        organizationId: 'organization-id',
        status: PaymentStatus.PAID,
      }),
    );
    expect(realtimeService.publishOrganizationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'organization-id',
        domain: 'billing',
        resource: 'transaction',
        action: 'created',
      }),
    );
    expect(result.status).toBe(PaymentStatus.PAID);
    expect(result.balance).toBe('0.00');
  });
});
