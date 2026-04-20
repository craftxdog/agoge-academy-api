import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import {
  MemberStatus,
  PaymentStatus,
  PaymentTransactionStatus,
} from 'generated/prisma/enums';
import {
  buildCursorPagination,
  getCursorId,
  PaginatedResult,
} from '../../../common';
import { PrismaService } from '../../../database/prisma.service';
import { BillingCatalogQueryDto, PaymentQueryDto } from '../dto';

const paymentTypeOrderBy = [
  { name: 'asc' },
  { key: 'asc' },
] satisfies Prisma.PaymentTypeOrderByWithRelationInput[];
const paymentMethodOrderBy = [
  { name: 'asc' },
  { key: 'asc' },
] satisfies Prisma.PaymentMethodOrderByWithRelationInput[];

const transactionInclude = {
  paymentMethod: true,
} satisfies Prisma.PaymentTransactionInclude;

const paymentInclude = {
  member: {
    include: {
      user: true,
    },
  },
  paymentType: true,
  transactions: {
    include: transactionInclude,
    orderBy: {
      createdAt: 'desc',
    },
  },
} satisfies Prisma.PaymentInclude;

export type BillingPaymentTypeRecord = Prisma.PaymentTypeGetPayload<object>;
export type BillingPaymentMethodRecord = Prisma.PaymentMethodGetPayload<object>;
export type BillingPaymentRecord = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;
export type BillingPaymentTransactionRecord =
  Prisma.PaymentTransactionGetPayload<{
    include: typeof transactionInclude;
  }>;
export type BillingMemberRecord = Prisma.OrganizationMemberGetPayload<{
  include: { user: true };
}>;

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPaymentTypes(
    organizationId: string,
    query: BillingCatalogQueryDto,
  ): Promise<BillingPaymentTypeRecord[]> {
    return this.prisma.paymentType.findMany({
      where: {
        organizationId,
        ...(query.isActive !== undefined && { isActive: query.isActive }),
        ...(query.search && {
          OR: [
            { key: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: paymentTypeOrderBy,
    });
  }

  findPaymentTypeById(
    organizationId: string,
    id: string,
  ): Promise<BillingPaymentTypeRecord | null> {
    return this.prisma.paymentType.findFirst({
      where: { id, organizationId },
    });
  }

  findPaymentTypeByKey(
    organizationId: string,
    key: string,
  ): Promise<BillingPaymentTypeRecord | null> {
    return this.prisma.paymentType.findFirst({
      where: { organizationId, key },
    });
  }

  createPaymentType(params: {
    organizationId: string;
    key: string;
    name: string;
    description?: string;
    amount?: string;
    currency: string;
    frequency?: Prisma.PaymentTypeCreateInput['frequency'];
    isActive?: boolean;
    config?: Record<string, unknown>;
  }): Promise<BillingPaymentTypeRecord> {
    return this.prisma.paymentType.create({
      data: {
        organizationId: params.organizationId,
        key: params.key,
        name: params.name,
        description: params.description,
        amount: params.amount,
        currency: params.currency,
        frequency: params.frequency,
        isActive: params.isActive,
        config: params.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  updatePaymentType(params: {
    organizationId: string;
    id: string;
    name?: string;
    description?: string;
    amount?: string | null;
    currency?: string;
    frequency?: Prisma.PaymentTypeUpdateInput['frequency'];
    isActive?: boolean;
    config?: Record<string, unknown>;
  }): Promise<BillingPaymentTypeRecord> {
    return this.prisma.paymentType.update({
      where: { id: params.id, organizationId: params.organizationId },
      data: {
        name: params.name,
        description: params.description,
        amount: params.amount,
        currency: params.currency,
        frequency: params.frequency,
        isActive: params.isActive,
        config: params.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async paymentTypeHasPayments(
    organizationId: string,
    id: string,
  ): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: { organizationId, paymentTypeId: id },
    });

    return count > 0;
  }

  deletePaymentType(
    organizationId: string,
    id: string,
  ): Promise<BillingPaymentTypeRecord> {
    return this.prisma.paymentType.delete({
      where: { id, organizationId },
    });
  }

  findPaymentMethods(
    organizationId: string,
    query: BillingCatalogQueryDto,
  ): Promise<BillingPaymentMethodRecord[]> {
    return this.prisma.paymentMethod.findMany({
      where: {
        organizationId,
        ...(query.isActive !== undefined && { isActive: query.isActive }),
        ...(query.search && {
          OR: [
            { key: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: paymentMethodOrderBy,
    });
  }

  findPaymentMethodById(
    organizationId: string,
    id: string,
  ): Promise<BillingPaymentMethodRecord | null> {
    return this.prisma.paymentMethod.findFirst({
      where: { id, organizationId },
    });
  }

  findPaymentMethodByKey(
    organizationId: string,
    key: string,
  ): Promise<BillingPaymentMethodRecord | null> {
    return this.prisma.paymentMethod.findFirst({
      where: { organizationId, key },
    });
  }

  createPaymentMethod(params: {
    organizationId: string;
    key: string;
    name: string;
    description?: string;
    requiresReference?: boolean;
    isActive?: boolean;
    config?: Record<string, unknown>;
  }): Promise<BillingPaymentMethodRecord> {
    return this.prisma.paymentMethod.create({
      data: {
        organizationId: params.organizationId,
        key: params.key,
        name: params.name,
        description: params.description,
        requiresReference: params.requiresReference,
        isActive: params.isActive,
        config: params.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  updatePaymentMethod(params: {
    organizationId: string;
    id: string;
    name?: string;
    description?: string;
    requiresReference?: boolean;
    isActive?: boolean;
    config?: Record<string, unknown>;
  }): Promise<BillingPaymentMethodRecord> {
    return this.prisma.paymentMethod.update({
      where: { id: params.id, organizationId: params.organizationId },
      data: {
        name: params.name,
        description: params.description,
        requiresReference: params.requiresReference,
        isActive: params.isActive,
        config: params.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async paymentMethodHasTransactions(
    organizationId: string,
    id: string,
  ): Promise<boolean> {
    const count = await this.prisma.paymentTransaction.count({
      where: {
        paymentMethodId: id,
        payment: { organizationId },
      },
    });

    return count > 0;
  }

  deletePaymentMethod(
    organizationId: string,
    id: string,
  ): Promise<BillingPaymentMethodRecord> {
    return this.prisma.paymentMethod.delete({
      where: { id, organizationId },
    });
  }

  findMember(
    organizationId: string,
    memberId: string,
  ): Promise<BillingMemberRecord | null> {
    return this.prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
        deletedAt: null,
        status: { not: MemberStatus.REMOVED },
      },
      include: { user: true },
    });
  }

  async findPaymentsPage(
    organizationId: string,
    query: PaymentQueryDto,
  ): Promise<PaginatedResult<BillingPaymentRecord>> {
    const cursorId = getCursorId(query.cursor);
    const where: Prisma.PaymentWhereInput = {
      organizationId,
      ...(query.status && { status: query.status }),
      ...(query.memberId && { memberId: query.memberId }),
      ...(query.paymentTypeId && { paymentTypeId: query.paymentTypeId }),
      ...((query.dueFrom || query.dueTo) && {
        dueDate: {
          ...(query.dueFrom && { gte: new Date(query.dueFrom) }),
          ...(query.dueTo && { lte: new Date(query.dueTo) }),
        },
      }),
    };

    const records = await this.prisma.payment.findMany({
      where,
      include: paymentInclude,
      take: query.limit + 1,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      orderBy: [
        {
          [query.sortBy]: query.sortDirection,
        } as Prisma.PaymentOrderByWithRelationInput,
        { id: query.sortDirection },
      ],
    });

    return buildCursorPagination(records, query);
  }

  findPaymentById(
    organizationId: string,
    id: string,
  ): Promise<BillingPaymentRecord | null> {
    return this.prisma.payment.findFirst({
      where: { id, organizationId },
      include: paymentInclude,
    });
  }

  createPayment(params: {
    organizationId: string;
    memberId: string;
    paymentTypeId?: string;
    invoiceNumber: string;
    amount: string;
    currency: string;
    status: PaymentStatus;
    dueDate: Date;
    periodMonth?: number;
    periodYear?: number;
    notes?: string;
    metadata?: Record<string, unknown>;
  }): Promise<BillingPaymentRecord> {
    return this.prisma.payment.create({
      data: {
        organizationId: params.organizationId,
        memberId: params.memberId,
        paymentTypeId: params.paymentTypeId,
        invoiceNumber: params.invoiceNumber,
        amount: params.amount,
        currency: params.currency,
        status: params.status,
        dueDate: params.dueDate,
        periodMonth: params.periodMonth,
        periodYear: params.periodYear,
        notes: params.notes,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
      include: paymentInclude,
    });
  }

  updatePayment(params: {
    organizationId: string;
    id: string;
    status?: PaymentStatus;
    dueDate?: Date;
    paidAt?: Date | null;
    notes?: string;
    metadata?: Record<string, unknown>;
  }): Promise<BillingPaymentRecord> {
    return this.prisma.payment.update({
      where: { id: params.id, organizationId: params.organizationId },
      data: {
        status: params.status,
        dueDate: params.dueDate,
        paidAt: params.paidAt,
        notes: params.notes,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
      include: paymentInclude,
    });
  }

  createTransaction(params: {
    paymentId: string;
    paymentMethodId?: string;
    amount: string;
    currency: string;
    status: PaymentTransactionStatus;
    reference?: string;
    processedAt?: Date;
    metadata?: Record<string, unknown>;
  }): Promise<BillingPaymentTransactionRecord> {
    return this.prisma.paymentTransaction.create({
      data: {
        paymentId: params.paymentId,
        paymentMethodId: params.paymentMethodId,
        amount: params.amount,
        currency: params.currency,
        status: params.status,
        reference: params.reference,
        processedAt: params.processedAt,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
      include: transactionInclude,
    });
  }

  findTransactions(
    organizationId: string,
    paymentId: string,
    status?: PaymentTransactionStatus,
  ): Promise<BillingPaymentTransactionRecord[]> {
    return this.prisma.paymentTransaction.findMany({
      where: {
        paymentId,
        ...(status && { status }),
        payment: { organizationId },
      },
      include: transactionInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  findOpenPayments(organizationId: string): Promise<BillingPaymentRecord[]> {
    return this.prisma.payment.findMany({
      where: {
        organizationId,
        status: {
          in: [
            PaymentStatus.PENDING,
            PaymentStatus.PARTIALLY_PAID,
            PaymentStatus.OVERDUE,
          ],
        },
      },
      include: paymentInclude,
    });
  }

  findPaidPaymentsSince(
    organizationId: string,
    since: Date,
  ): Promise<BillingPaymentRecord[]> {
    return this.prisma.payment.findMany({
      where: {
        organizationId,
        status: PaymentStatus.PAID,
        paidAt: { gte: since },
      },
      include: paymentInclude,
    });
  }
}
