import { BillingController } from './billing.controller';

describe('BillingController', () => {
  const billingService = {
    getSummary: jest.fn(),
    listPaymentTypes: jest.fn(),
    createPaymentType: jest.fn(),
    updatePaymentType: jest.fn(),
    deletePaymentType: jest.fn(),
    listPaymentMethods: jest.fn(),
    createPaymentMethod: jest.fn(),
    updatePaymentMethod: jest.fn(),
    deletePaymentMethod: jest.fn(),
    listPayments: jest.fn(),
    createPayment: jest.fn(),
    getPayment: jest.fn(),
    updatePayment: jest.fn(),
    listTransactions: jest.fn(),
    createTransaction: jest.fn(),
  };
  let controller: BillingController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new BillingController(billingService as never);
  });

  it('delegates payment summary requests', async () => {
    const response = { openBalance: '0.00' };
    billingService.getSummary.mockResolvedValue(response);

    await expect(controller.getSummary('organization-id')).resolves.toBe(
      response,
    );
    expect(billingService.getSummary).toHaveBeenCalledWith('organization-id');
  });

  it('delegates payment type CRUD requests', async () => {
    const query = { search: 'membership' };
    const dto = { key: 'membership', name: 'Membership' };
    const response = { id: 'payment-type-id' };
    billingService.listPaymentTypes.mockResolvedValue(response);
    billingService.createPaymentType.mockResolvedValue(response);
    billingService.updatePaymentType.mockResolvedValue(response);
    billingService.deletePaymentType.mockResolvedValue(response);

    await expect(
      controller.listPaymentTypes('organization-id', query as never),
    ).resolves.toBe(response);
    await expect(
      controller.createPaymentType('organization-id', dto as never),
    ).resolves.toBe(response);
    await expect(
      controller.updatePaymentType(
        'organization-id',
        'payment-type-id',
        dto as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.deletePaymentType('organization-id', 'payment-type-id'),
    ).resolves.toBe(response);

    expect(billingService.listPaymentTypes).toHaveBeenCalledWith(
      'organization-id',
      query,
    );
    expect(billingService.createPaymentType).toHaveBeenCalledWith(
      'organization-id',
      dto,
    );
    expect(billingService.updatePaymentType).toHaveBeenCalledWith(
      'organization-id',
      'payment-type-id',
      dto,
    );
    expect(billingService.deletePaymentType).toHaveBeenCalledWith(
      'organization-id',
      'payment-type-id',
    );
  });

  it('delegates payment method CRUD requests', async () => {
    const query = { search: 'bank' };
    const dto = { key: 'transfer', name: 'Transfer' };
    const response = { id: 'payment-method-id' };
    billingService.listPaymentMethods.mockResolvedValue(response);
    billingService.createPaymentMethod.mockResolvedValue(response);
    billingService.updatePaymentMethod.mockResolvedValue(response);
    billingService.deletePaymentMethod.mockResolvedValue(response);

    await expect(
      controller.listPaymentMethods('organization-id', query as never),
    ).resolves.toBe(response);
    await expect(
      controller.createPaymentMethod('organization-id', dto as never),
    ).resolves.toBe(response);
    await expect(
      controller.updatePaymentMethod(
        'organization-id',
        'payment-method-id',
        dto as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.deletePaymentMethod('organization-id', 'payment-method-id'),
    ).resolves.toBe(response);
  });

  it('delegates payment lifecycle requests', async () => {
    const query = { status: 'PENDING' };
    const createDto = { memberId: 'member-id', dueDate: '2026-04-30' };
    const updateDto = { notes: 'updated' };
    const response = { id: 'payment-id' };
    billingService.listPayments.mockResolvedValue(response);
    billingService.createPayment.mockResolvedValue(response);
    billingService.getPayment.mockResolvedValue(response);
    billingService.updatePayment.mockResolvedValue(response);

    await expect(
      controller.listPayments('organization-id', query as never),
    ).resolves.toBe(response);
    await expect(
      controller.createPayment('organization-id', createDto as never),
    ).resolves.toBe(response);
    await expect(
      controller.getPayment('organization-id', 'payment-id'),
    ).resolves.toBe(response);
    await expect(
      controller.updatePayment(
        'organization-id',
        'payment-id',
        updateDto as never,
      ),
    ).resolves.toBe(response);
  });

  it('delegates transaction list and create requests', async () => {
    const query = { limit: 10 };
    const dto = { amount: '45.00' };
    const response = { id: 'payment-id', balance: '0.00' };
    billingService.listTransactions.mockResolvedValue(response);
    billingService.createTransaction.mockResolvedValue(response);

    await expect(
      controller.listTransactions(
        'organization-id',
        'payment-id',
        query as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.createTransaction(
        'organization-id',
        'payment-id',
        dto as never,
      ),
    ).resolves.toBe(response);
    expect(billingService.listTransactions).toHaveBeenCalledWith(
      'organization-id',
      'payment-id',
      query,
    );
    expect(billingService.createTransaction).toHaveBeenCalledWith(
      'organization-id',
      'payment-id',
      dto,
    );
  });
});
