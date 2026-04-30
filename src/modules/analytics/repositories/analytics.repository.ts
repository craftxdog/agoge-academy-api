import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import {
  InvitationStatus,
  MemberStatus,
  NotificationType,
  PaymentStatus,
  PaymentTransactionStatus,
} from 'generated/prisma/enums';
import { PrismaService } from '../../../database/prisma.service';

const paymentTypeCatalogOrderBy = [
  { name: 'asc' },
  { key: 'asc' },
] satisfies Prisma.PaymentTypeOrderByWithRelationInput[];
const paymentMethodCatalogOrderBy = [
  { name: 'asc' },
  { key: 'asc' },
] satisfies Prisma.PaymentMethodOrderByWithRelationInput[];
const locationCatalogOrderBy = [
  { name: 'asc' },
] satisfies Prisma.LocationOrderByWithRelationInput[];

export type AnalyticsPaymentRecord = {
  id: string;
  amount: Prisma.Decimal;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  dueDate: Date;
  paymentType: {
    id: string;
    key: string;
    name: string;
  } | null;
  transactions: {
    amount: Prisma.Decimal;
    status: PaymentTransactionStatus;
  }[];
};

export type AnalyticsTransactionRecord = {
  id: string;
  amount: Prisma.Decimal;
  currency: string;
  status: PaymentTransactionStatus;
  processedAt: Date | null;
  createdAt: Date;
  paymentMethod: {
    id: string;
    key: string;
    name: string;
  } | null;
};

export type AnalyticsMemberRecord = {
  id: string;
  status: MemberStatus;
  joinedAt: Date | null;
  deletedAt: Date | null;
};

export type AnalyticsInvitationRecord = {
  id: string;
  status: InvitationStatus;
  createdAt: Date;
};

export type AnalyticsCatalogRecord = {
  id: string;
  key: string;
  name: string;
};

export type AnalyticsNotificationRecord = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPaymentsCreatedBetween(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<AnalyticsPaymentRecord[]> {
    return this.prisma.payment.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        dueDate: true,
        paymentType: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        transactions: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    });
  }

  findOpenPaymentsUntil(
    organizationId: string,
    end: Date,
  ): Promise<AnalyticsPaymentRecord[]> {
    return this.prisma.payment.findMany({
      where: {
        organizationId,
        createdAt: {
          lte: end,
        },
        status: {
          in: [
            PaymentStatus.PENDING,
            PaymentStatus.PARTIALLY_PAID,
            PaymentStatus.OVERDUE,
          ],
        },
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        dueDate: true,
        paymentType: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        transactions: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    });
  }

  findTransactionsProcessedBetween(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<AnalyticsTransactionRecord[]> {
    return this.prisma.paymentTransaction.findMany({
      where: {
        payment: {
          organizationId,
        },
        OR: [
          {
            processedAt: {
              gte: start,
              lte: end,
            },
          },
          {
            processedAt: null,
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        ],
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        processedAt: true,
        createdAt: true,
        paymentMethod: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
    });
  }

  findMembers(organizationId: string): Promise<AnalyticsMemberRecord[]> {
    return this.prisma.organizationMember.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        status: true,
        joinedAt: true,
        deletedAt: true,
      },
    });
  }

  findInvitationsCreatedBetween(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<AnalyticsInvitationRecord[]> {
    return this.prisma.invitation.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });
  }

  countPendingInvitations(organizationId: string): Promise<number> {
    return this.prisma.invitation.count({
      where: {
        organizationId,
        status: 'PENDING',
      },
    });
  }

  countLocations(organizationId: string): Promise<number> {
    return this.prisma.location.count({
      where: {
        organizationId,
      },
    });
  }

  countActiveLocations(organizationId: string): Promise<number> {
    return this.prisma.location.count({
      where: {
        organizationId,
        isActive: true,
      },
    });
  }

  countBusinessHourWindows(organizationId: string): Promise<number> {
    return this.prisma.businessHour.count({
      where: {
        organizationId,
      },
    });
  }

  countMemberScheduleWindows(organizationId: string): Promise<number> {
    return this.prisma.memberSchedule.count({
      where: {
        member: {
          organizationId,
          deletedAt: null,
        },
      },
    });
  }

  async countScheduledMembers(organizationId: string): Promise<number> {
    const members = await this.prisma.memberSchedule.findMany({
      where: {
        member: {
          organizationId,
          deletedAt: null,
        },
      },
      select: {
        memberId: true,
      },
      distinct: ['memberId'],
    });

    return members.length;
  }

  countUnreadNotifications(organizationId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        organizationId,
        isRead: false,
      },
    });
  }

  findRecentNotifications(
    organizationId: string,
    limit: number,
  ): Promise<AnalyticsNotificationRecord[]> {
    return this.prisma.notification.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  countUpcomingExceptions(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    return this.prisma.scheduleException.count({
      where: {
        organizationId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });
  }

  countAuditEventsBetween(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        organizationId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });
  }

  findAuditActionsBetween(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<Array<{ action: string }>> {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        action: true,
      },
    });
  }

  findEnabledModules(organizationId: string): Promise<Array<{ key: string }>> {
    return this.prisma.organizationModule
      .findMany({
        where: {
          organizationId,
          isEnabled: true,
        },
        select: {
          module: {
            select: {
              key: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { module: { key: 'asc' } }],
      })
      .then((records) => records.map((record) => ({ key: record.module.key })));
  }

  findPaymentTypesCatalog(
    organizationId: string,
  ): Promise<AnalyticsCatalogRecord[]> {
    return this.prisma.paymentType.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        key: true,
        name: true,
      },
      orderBy: paymentTypeCatalogOrderBy,
    });
  }

  findPaymentMethodsCatalog(
    organizationId: string,
  ): Promise<AnalyticsCatalogRecord[]> {
    return this.prisma.paymentMethod.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        key: true,
        name: true,
      },
      orderBy: paymentMethodCatalogOrderBy,
    });
  }

  findLocationsCatalog(
    organizationId: string,
  ): Promise<AnalyticsCatalogRecord[]> {
    return this.prisma.location
      .findMany({
        where: {
          organizationId,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: locationCatalogOrderBy,
      })
      .then((locations) =>
        locations.map((location) => ({
          id: location.id,
          key: location.id,
          name: location.name,
        })),
      );
  }

  async findCurrenciesCatalog(organizationId: string): Promise<string[]> {
    const paymentCurrencies = await this.prisma.payment.groupBy({
      by: ['currency'],
      where: {
        organizationId,
      },
      orderBy: {
        currency: 'asc',
      },
    });

    return paymentCurrencies.map((item) => item.currency);
  }
}
