import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  PaymentFrequency,
  PaymentStatus,
  PaymentTransactionStatus,
} from 'generated/prisma/enums';
import { PaginatedResult } from '../../../common';
import {
  BillingCatalogQueryDto,
  BillingSummaryResponseDto,
  CreatePaymentDto,
  CreatePaymentMethodDto,
  CreatePaymentTransactionDto,
  CreatePaymentTypeDto,
  PaymentMethodResponseDto,
  PaymentQueryDto,
  PaymentResponseDto,
  PaymentTransactionQueryDto,
  PaymentTransactionResponseDto,
  PaymentTypeResponseDto,
  UpdatePaymentDto,
  UpdatePaymentMethodDto,
  UpdatePaymentTypeDto,
} from '../dto';
import {
  BillingPaymentMethodRecord,
  BillingPaymentRecord,
  BillingPaymentTransactionRecord,
  BillingPaymentTypeRecord,
  BillingRepository,
} from '../repositories/billing.repository';

const TERMINAL_PAYMENT_STATUSES = [
  PaymentStatus.CANCELLED,
  PaymentStatus.REFUNDED,
] as const;

@Injectable()
export class BillingService {
  constructor(private readonly billingRepository: BillingRepository) {}

  async listPaymentTypes(
    organizationId: string,
    query: BillingCatalogQueryDto,
  ): Promise<PaymentTypeResponseDto[]> {
    const paymentTypes = await this.billingRepository.findPaymentTypes(
      organizationId,
      query,
    );

    return paymentTypes.map((paymentType) => this.mapPaymentType(paymentType));
  }

  async createPaymentType(
    organizationId: string,
    dto: CreatePaymentTypeDto,
  ): Promise<PaymentTypeResponseDto> {
    const key = this.normalizeKey(dto.key);

    if (
      await this.billingRepository.findPaymentTypeByKey(organizationId, key)
    ) {
      throw new ConflictException('Payment type key already exists');
    }

    const paymentType = await this.billingRepository.createPaymentType({
      organizationId,
      key,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      amount: dto.amount,
      currency: this.normalizeCurrency(dto.currency),
      frequency: dto.frequency ?? PaymentFrequency.ONE_TIME,
      isActive: dto.isActive ?? true,
      config: dto.config,
    });

    return this.mapPaymentType(paymentType);
  }

  async updatePaymentType(
    organizationId: string,
    paymentTypeId: string,
    dto: UpdatePaymentTypeDto,
  ): Promise<PaymentTypeResponseDto> {
    await this.getPaymentTypeOrThrow(organizationId, paymentTypeId);
    const paymentType = await this.billingRepository.updatePaymentType({
      organizationId,
      id: paymentTypeId,
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      amount: dto.amount,
      currency: dto.currency?.trim().toUpperCase(),
      frequency: dto.frequency,
      isActive: dto.isActive,
      config: dto.config,
    });

    return this.mapPaymentType(paymentType);
  }

  async deletePaymentType(
    organizationId: string,
    paymentTypeId: string,
  ): Promise<PaymentTypeResponseDto> {
    const paymentType = await this.getPaymentTypeOrThrow(
      organizationId,
      paymentTypeId,
    );

    if (
      await this.billingRepository.paymentTypeHasPayments(
        organizationId,
        paymentTypeId,
      )
    ) {
      const archived = await this.billingRepository.updatePaymentType({
        organizationId,
        id: paymentTypeId,
        isActive: false,
      });

      return this.mapPaymentType(archived);
    }

    const deleted = await this.billingRepository.deletePaymentType(
      organizationId,
      paymentType.id,
    );

    return this.mapPaymentType(deleted);
  }

  async listPaymentMethods(
    organizationId: string,
    query: BillingCatalogQueryDto,
  ): Promise<PaymentMethodResponseDto[]> {
    const paymentMethods = await this.billingRepository.findPaymentMethods(
      organizationId,
      query,
    );

    return paymentMethods.map((method) => this.mapPaymentMethod(method));
  }

  async createPaymentMethod(
    organizationId: string,
    dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const key = this.normalizeKey(dto.key);

    if (
      await this.billingRepository.findPaymentMethodByKey(organizationId, key)
    ) {
      throw new ConflictException('Payment method key already exists');
    }

    const paymentMethod = await this.billingRepository.createPaymentMethod({
      organizationId,
      key,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      requiresReference: dto.requiresReference ?? false,
      isActive: dto.isActive ?? true,
      config: dto.config,
    });

    return this.mapPaymentMethod(paymentMethod);
  }

  async updatePaymentMethod(
    organizationId: string,
    paymentMethodId: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    await this.getPaymentMethodOrThrow(organizationId, paymentMethodId);
    const paymentMethod = await this.billingRepository.updatePaymentMethod({
      organizationId,
      id: paymentMethodId,
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      requiresReference: dto.requiresReference,
      isActive: dto.isActive,
      config: dto.config,
    });

    return this.mapPaymentMethod(paymentMethod);
  }

  async deletePaymentMethod(
    organizationId: string,
    paymentMethodId: string,
  ): Promise<PaymentMethodResponseDto> {
    const paymentMethod = await this.getPaymentMethodOrThrow(
      organizationId,
      paymentMethodId,
    );

    if (
      await this.billingRepository.paymentMethodHasTransactions(
        organizationId,
        paymentMethodId,
      )
    ) {
      const archived = await this.billingRepository.updatePaymentMethod({
        organizationId,
        id: paymentMethodId,
        isActive: false,
      });

      return this.mapPaymentMethod(archived);
    }

    const deleted = await this.billingRepository.deletePaymentMethod(
      organizationId,
      paymentMethod.id,
    );

    return this.mapPaymentMethod(deleted);
  }

  async listPayments(
    organizationId: string,
    query: PaymentQueryDto,
  ): Promise<PaginatedResult<PaymentResponseDto>> {
    const page = await this.billingRepository.findPaymentsPage(
      organizationId,
      query,
    );

    return {
      ...page,
      items: page.items.map((payment) => this.mapPayment(payment)),
      message: 'Payments retrieved successfully',
    };
  }

  async getPayment(
    organizationId: string,
    paymentId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.getPaymentOrThrow(organizationId, paymentId);

    return this.mapPayment(payment);
  }

  async createPayment(
    organizationId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    await this.assertMemberExists(organizationId, dto.memberId);
    const paymentType = dto.paymentTypeId
      ? await this.getPaymentTypeOrThrow(organizationId, dto.paymentTypeId)
      : null;
    const amount = dto.amount ?? paymentType?.amount?.toString();

    if (!amount) {
      throw new BadRequestException(
        'amount is required when paymentType has no default amount',
      );
    }

    const dueDate = new Date(dto.dueDate);
    const payment = await this.billingRepository.createPayment({
      organizationId,
      memberId: dto.memberId,
      paymentTypeId: paymentType?.id,
      invoiceNumber: dto.invoiceNumber?.trim() ?? this.createInvoiceNumber(),
      amount,
      currency: this.normalizeCurrency(dto.currency ?? paymentType?.currency),
      status: this.resolveOpenStatus(dueDate),
      dueDate,
      periodMonth: dto.periodMonth,
      periodYear: dto.periodYear,
      notes: dto.notes?.trim(),
      metadata: dto.metadata,
    });

    return this.mapPayment(payment);
  }

  async updatePayment(
    organizationId: string,
    paymentId: string,
    dto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const currentPayment = await this.getPaymentOrThrow(
      organizationId,
      paymentId,
    );
    const status = dto.status ?? currentPayment.status;
    const paidAt =
      status === PaymentStatus.PAID
        ? (currentPayment.paidAt ?? new Date())
        : status === PaymentStatus.PENDING ||
            status === PaymentStatus.PARTIALLY_PAID ||
            status === PaymentStatus.OVERDUE
          ? null
          : currentPayment.paidAt;

    const payment = await this.billingRepository.updatePayment({
      organizationId,
      id: paymentId,
      status,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      paidAt,
      notes: dto.notes?.trim(),
      metadata: dto.metadata,
    });

    return this.mapPayment(payment);
  }

  async createTransaction(
    organizationId: string,
    paymentId: string,
    dto: CreatePaymentTransactionDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.getPaymentOrThrow(organizationId, paymentId);

    if (TERMINAL_PAYMENT_STATUSES.includes(payment.status as never)) {
      throw new BadRequestException(
        'Transactions cannot be added to cancelled or refunded payments',
      );
    }

    const paymentMethod = dto.paymentMethodId
      ? await this.getPaymentMethodOrThrow(organizationId, dto.paymentMethodId)
      : null;

    if (paymentMethod?.requiresReference && !dto.reference) {
      throw new BadRequestException(
        'reference is required for this payment method',
      );
    }

    await this.billingRepository.createTransaction({
      paymentId: payment.id,
      paymentMethodId: paymentMethod?.id,
      amount: dto.amount,
      currency: this.normalizeCurrency(dto.currency ?? payment.currency),
      status: dto.status ?? PaymentTransactionStatus.SUCCEEDED,
      reference: dto.reference?.trim(),
      processedAt:
        dto.processedAt !== undefined ? new Date(dto.processedAt) : new Date(),
      metadata: dto.metadata,
    });

    const hydratedPayment = await this.getPaymentOrThrow(
      organizationId,
      paymentId,
    );
    const nextStatus = this.resolvePaymentStatus(hydratedPayment);
    const paidAt =
      nextStatus === PaymentStatus.PAID
        ? (hydratedPayment.paidAt ?? new Date())
        : null;

    const settledPayment = await this.billingRepository.updatePayment({
      organizationId,
      id: paymentId,
      status: nextStatus,
      paidAt,
    });

    return this.mapPayment(settledPayment);
  }

  async listTransactions(
    organizationId: string,
    paymentId: string,
    query: PaymentTransactionQueryDto,
  ): Promise<PaymentTransactionResponseDto[]> {
    await this.getPaymentOrThrow(organizationId, paymentId);
    const transactions = await this.billingRepository.findTransactions(
      organizationId,
      paymentId,
      query.status,
    );

    return transactions.map((transaction) => this.mapTransaction(transaction));
  }

  async getSummary(organizationId: string): Promise<BillingSummaryResponseDto> {
    const [openPayments, paidThisMonth] = await Promise.all([
      this.billingRepository.findOpenPayments(organizationId),
      this.billingRepository.findPaidPaymentsSince(
        organizationId,
        this.getStartOfMonth(),
      ),
    ]);
    const now = Date.now();
    const overduePayments = openPayments.filter(
      (payment) => payment.dueDate.getTime() < now,
    );

    return {
      openPayments: openPayments.length,
      openBalance: this.formatCents(
        openPayments.reduce(
          (total, payment) => total + this.getBalanceCents(payment),
          0,
        ),
      ),
      overduePayments: overduePayments.length,
      overdueBalance: this.formatCents(
        overduePayments.reduce(
          (total, payment) => total + this.getBalanceCents(payment),
          0,
        ),
      ),
      paidThisMonth: this.formatCents(
        paidThisMonth.reduce(
          (total, payment) => total + this.getPaidAmountCents(payment),
          0,
        ),
      ),
    };
  }

  private async getPaymentTypeOrThrow(
    organizationId: string,
    paymentTypeId: string,
  ): Promise<BillingPaymentTypeRecord> {
    const paymentType = await this.billingRepository.findPaymentTypeById(
      organizationId,
      paymentTypeId,
    );

    if (!paymentType) {
      throw new NotFoundException('Payment type was not found in this tenant');
    }

    return paymentType;
  }

  private async getPaymentMethodOrThrow(
    organizationId: string,
    paymentMethodId: string,
  ): Promise<BillingPaymentMethodRecord> {
    const paymentMethod = await this.billingRepository.findPaymentMethodById(
      organizationId,
      paymentMethodId,
    );

    if (!paymentMethod) {
      throw new NotFoundException(
        'Payment method was not found in this tenant',
      );
    }

    return paymentMethod;
  }

  private async getPaymentOrThrow(
    organizationId: string,
    paymentId: string,
  ): Promise<BillingPaymentRecord> {
    const payment = await this.billingRepository.findPaymentById(
      organizationId,
      paymentId,
    );

    if (!payment) {
      throw new NotFoundException('Payment was not found in this tenant');
    }

    return payment;
  }

  private async assertMemberExists(
    organizationId: string,
    memberId: string,
  ): Promise<void> {
    const member = await this.billingRepository.findMember(
      organizationId,
      memberId,
    );

    if (!member) {
      throw new NotFoundException('Member was not found in this tenant');
    }
  }

  private resolvePaymentStatus(payment: BillingPaymentRecord): PaymentStatus {
    const paidAmount = this.getPaidAmountCents(payment);
    const amount = this.toCents(payment.amount.toString());

    if (paidAmount >= amount) {
      return PaymentStatus.PAID;
    }

    if (paidAmount > 0) {
      return PaymentStatus.PARTIALLY_PAID;
    }

    return this.resolveOpenStatus(payment.dueDate);
  }

  private resolveOpenStatus(dueDate: Date): PaymentStatus {
    return dueDate.getTime() < Date.now()
      ? PaymentStatus.OVERDUE
      : PaymentStatus.PENDING;
  }

  private getPaidAmountCents(payment: BillingPaymentRecord): number {
    return payment.transactions
      .filter(
        (transaction) =>
          transaction.status === PaymentTransactionStatus.SUCCEEDED,
      )
      .reduce(
        (total, transaction) =>
          total + this.toCents(transaction.amount.toString()),
        0,
      );
  }

  private getBalanceCents(payment: BillingPaymentRecord): number {
    return Math.max(
      this.toCents(payment.amount.toString()) -
        this.getPaidAmountCents(payment),
      0,
    );
  }

  private toCents(value: string): number {
    const [whole, decimal = ''] = value.split('.');
    const normalizedDecimal = decimal.padEnd(2, '0').slice(0, 2);

    return Number(whole) * 100 + Number(normalizedDecimal);
  }

  private formatCents(cents: number): string {
    const sign = cents < 0 ? '-' : '';
    const absolute = Math.abs(cents);
    const whole = Math.floor(absolute / 100);
    const decimal = String(absolute % 100).padStart(2, '0');

    return `${sign}${whole}.${decimal}`;
  }

  private normalizeKey(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizeCurrency(value?: string): string {
    return (value ?? 'USD').trim().toUpperCase();
  }

  private createInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const suffix = randomBytes(3).toString('hex').toUpperCase();

    return `INV-${year}${month}-${suffix}`;
  }

  private getStartOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private mapPaymentType(
    paymentType: BillingPaymentTypeRecord,
  ): PaymentTypeResponseDto {
    return {
      id: paymentType.id,
      key: paymentType.key,
      name: paymentType.name,
      description: paymentType.description,
      amount: paymentType.amount?.toString() ?? null,
      currency: paymentType.currency,
      frequency: paymentType.frequency,
      isActive: paymentType.isActive,
      config: paymentType.config,
      createdAt: paymentType.createdAt,
      updatedAt: paymentType.updatedAt,
    };
  }

  private mapPaymentMethod(
    paymentMethod: BillingPaymentMethodRecord,
  ): PaymentMethodResponseDto {
    return {
      id: paymentMethod.id,
      key: paymentMethod.key,
      name: paymentMethod.name,
      description: paymentMethod.description,
      requiresReference: paymentMethod.requiresReference,
      isActive: paymentMethod.isActive,
      config: paymentMethod.config,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt,
    };
  }

  private mapPayment(payment: BillingPaymentRecord): PaymentResponseDto {
    return {
      id: payment.id,
      invoiceNumber: payment.invoiceNumber,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status,
      dueDate: payment.dueDate,
      paidAt: payment.paidAt,
      periodMonth: payment.periodMonth,
      periodYear: payment.periodYear,
      notes: payment.notes,
      metadata: payment.metadata,
      member: {
        id: payment.member.id,
        email: payment.member.user.email,
        firstName: payment.member.user.firstName,
        lastName: payment.member.user.lastName,
      },
      paymentType: payment.paymentType
        ? this.mapPaymentType(payment.paymentType)
        : null,
      paidAmount: this.formatCents(this.getPaidAmountCents(payment)),
      balance: this.formatCents(this.getBalanceCents(payment)),
      transactions: payment.transactions.map((transaction) =>
        this.mapTransaction(transaction),
      ),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  private mapTransaction(
    transaction: BillingPaymentTransactionRecord,
  ): PaymentTransactionResponseDto {
    return {
      id: transaction.id,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      status: transaction.status,
      reference: transaction.reference,
      paymentMethod: transaction.paymentMethod
        ? this.mapPaymentMethod(transaction.paymentMethod)
        : null,
      processedAt: transaction.processedAt,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt,
    };
  }
}
