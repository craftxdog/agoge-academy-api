import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import {
  InvitationStatus,
  MemberStatus,
  PaymentTransactionStatus,
} from 'generated/prisma/enums';
import {
  AnalyticsCatalogResponseDto,
  AnalyticsDashboardResponseDto,
  AnalyticsDimensionAmountDto,
  AnalyticsDimensionCountDto,
  AnalyticsGroupBy,
  AnalyticsInsightResponseDto,
  AnalyticsMemberResponseDto,
  AnalyticsMoneyMetricDto,
  AnalyticsOperationsResponseDto,
  AnalyticsOverviewResponseDto,
  AnalyticsQueryDto,
  AnalyticsRangeResponseDto,
  AnalyticsRateMetricDto,
  AnalyticsRevenueResponseDto,
  AnalyticsTrendPointDto,
} from '../dto';
import {
  AnalyticsInvitationRecord,
  AnalyticsMemberRecord,
  AnalyticsPaymentRecord,
  AnalyticsRepository,
  AnalyticsTransactionRecord,
} from '../repositories';

type AnalyticsRange = {
  start: Date;
  end: Date;
  groupBy: AnalyticsGroupBy;
  top: number;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getDashboard(
    organizationId: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsDashboardResponseDto> {
    const [revenue, members, operations] = await Promise.all([
      this.getRevenue(organizationId, query),
      this.getMembers(organizationId, query),
      this.getOperations(organizationId, query),
    ]);

    return {
      generatedAt: new Date(),
      range: revenue.range,
      overview: this.buildOverview(revenue, members, operations),
      revenue,
      members,
      operations,
      insights: this.buildInsights(revenue, members, operations),
    };
  }

  async getRevenue(
    organizationId: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsRevenueResponseDto> {
    const range = this.resolveRange(query);
    const [paymentsCreatedInRange, openPaymentsUntilEnd, transactionsInRange] =
      await Promise.all([
        this.analyticsRepository.findPaymentsCreatedBetween(
          organizationId,
          range.start,
          range.end,
        ),
        this.analyticsRepository.findOpenPaymentsUntil(organizationId, range.end),
        this.analyticsRepository.findTransactionsProcessedBetween(
          organizationId,
          range.start,
          range.end,
        ),
      ]);

    const invoicedAmount = this.sumPaymentAmounts(paymentsCreatedInRange);
    const collectedTransactions = transactionsInRange.filter(
      (transaction) => transaction.status === PaymentTransactionStatus.SUCCEEDED,
    );
    const collectedAmount = this.sumTransactionAmounts(collectedTransactions);
    const outstandingAmount = this.sumOutstandingBalances(openPaymentsUntilEnd);
    const overdueAmount = this.sumOutstandingBalances(
      openPaymentsUntilEnd.filter((payment) => payment.dueDate <= range.end),
    );
    const currency = this.resolveCurrency(
      paymentsCreatedInRange.map((payment) => payment.currency),
      transactionsInRange.map((transaction) => transaction.currency),
    );

    return {
      range: this.mapRange(range),
      invoiced: this.toMoneyMetric(invoicedAmount, currency),
      collected: this.toMoneyMetric(collectedAmount, currency),
      outstanding: this.toMoneyMetric(outstandingAmount, currency),
      overdue: this.toMoneyMetric(overdueAmount, currency),
      collectionRate: this.toRateMetric(
        invoicedAmount === 0 ? 0 : (collectedAmount / invoicedAmount) * 100,
      ),
      statusBreakdown: this.buildPaymentStatusBreakdown(paymentsCreatedInRange),
      topPaymentTypes: this.buildTopPaymentTypes(
        paymentsCreatedInRange,
        range.top,
        currency,
      ),
      collectedByMethod: this.buildCollectedByMethod(
        collectedTransactions,
        range.top,
        currency,
      ),
      trend: this.buildTrend(range, {
        payments: paymentsCreatedInRange,
        transactions: transactionsInRange,
      }),
    };
  }

  async getMembers(
    organizationId: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsMemberResponseDto> {
    const range = this.resolveRange(query);
    const [members, invitationsInRange, pendingInvitations] = await Promise.all([
      this.analyticsRepository.findMembers(organizationId),
      this.analyticsRepository.findInvitationsCreatedBetween(
        organizationId,
        range.start,
        range.end,
      ),
      this.analyticsRepository.countPendingInvitations(organizationId),
    ]);

    const activeMembers = members.filter(
      (member) =>
        member.status === MemberStatus.ACTIVE && member.deletedAt === null,
    ).length;
    const invitedMembers = members.filter(
      (member) =>
        member.status === MemberStatus.INVITED && member.deletedAt === null,
    ).length;
    const suspendedMembers = members.filter(
      (member) =>
        member.status === MemberStatus.SUSPENDED && member.deletedAt === null,
    ).length;
    const removedMembers = members.filter(
      (member) => member.status === MemberStatus.REMOVED,
    ).length;
    const currentMembers = activeMembers + invitedMembers + suspendedMembers;
    const newMembers = members.filter(
      (member) =>
        member.joinedAt &&
        member.joinedAt >= range.start &&
        member.joinedAt <= range.end,
    ).length;
    const acceptedInvitations = invitationsInRange.filter(
      (invitation) => invitation.status === InvitationStatus.ACCEPTED,
    ).length;
    const acceptanceBase = invitationsInRange.length;

    return {
      range: this.mapRange(range),
      currentMembers,
      activeMembers,
      invitedMembers,
      suspendedMembers,
      removedMembers,
      newMembers,
      pendingInvitations,
      acceptedInvitations,
      invitationAcceptanceRate: this.toRateMetric(
        acceptanceBase === 0 ? 0 : (acceptedInvitations / acceptanceBase) * 100,
      ),
      statusBreakdown: this.buildMemberStatusBreakdown({
        activeMembers,
        invitedMembers,
        suspendedMembers,
        removedMembers,
      }),
      trend: this.buildTrend(range, {
        members,
        invitations: invitationsInRange,
      }),
    };
  }

  async getOperations(
    organizationId: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsOperationsResponseDto> {
    const range = this.resolveRange(query);
    const [
      members,
      totalLocations,
      activeLocations,
      businessHourWindows,
      memberScheduleWindows,
      scheduledMembers,
      unreadNotifications,
      upcomingExceptions,
      auditEvents,
      topAuditActions,
      enabledModules,
    ] = await Promise.all([
      this.analyticsRepository.findMembers(organizationId),
      this.analyticsRepository.countLocations(organizationId),
      this.analyticsRepository.countActiveLocations(organizationId),
      this.analyticsRepository.countBusinessHourWindows(organizationId),
      this.analyticsRepository.countMemberScheduleWindows(organizationId),
      this.analyticsRepository.countScheduledMembers(organizationId),
      this.analyticsRepository.countUnreadNotifications(organizationId),
      this.analyticsRepository.countUpcomingExceptions(
        organizationId,
        range.start,
        this.addDays(range.end, 30),
      ),
      this.analyticsRepository.countAuditEventsBetween(
        organizationId,
        range.start,
        range.end,
      ),
      this.analyticsRepository.findAuditActionsBetween(
        organizationId,
        range.start,
        range.end,
      ),
      this.analyticsRepository.findEnabledModules(organizationId),
    ]);

    const activeMembers = members.filter(
      (member) =>
        member.status === MemberStatus.ACTIVE && member.deletedAt === null,
    ).length;

    return {
      range: this.mapRange(range),
      totalLocations,
      activeLocations,
      businessHourWindows,
      memberScheduleWindows,
      scheduledMembers,
      scheduleCoverageRate: this.toRateMetric(
        activeMembers === 0 ? 0 : (scheduledMembers / activeMembers) * 100,
      ),
      unreadNotifications,
      upcomingExceptions,
      auditEvents,
      enabledModulesCount: enabledModules.length,
      enabledModules: enabledModules.map((module) => module.key),
      topAuditActions: this.buildTopAuditActions(topAuditActions, range.top),
    };
  }

  async getCatalog(
    organizationId: string,
  ): Promise<AnalyticsCatalogResponseDto> {
    const [paymentTypes, paymentMethods, locations, currencies, enabledModules] =
      await Promise.all([
        this.analyticsRepository.findPaymentTypesCatalog(organizationId),
        this.analyticsRepository.findPaymentMethodsCatalog(organizationId),
        this.analyticsRepository.findLocationsCatalog(organizationId),
        this.analyticsRepository.findCurrenciesCatalog(organizationId),
        this.analyticsRepository.findEnabledModules(organizationId),
      ]);

    return {
      paymentTypes: paymentTypes.map((item) => ({
        id: item.id,
        key: item.key,
        label: item.name,
      })),
      paymentMethods: paymentMethods.map((item) => ({
        id: item.id,
        key: item.key,
        label: item.name,
      })),
      locations: locations.map((item) => ({
        id: item.id,
        key: item.key,
        label: item.name,
      })),
      currencies,
      enabledModules: enabledModules.map((module) => module.key),
    };
  }

  private resolveRange(query: AnalyticsQueryDto): AnalyticsRange {
    const end = query.dateTo ? new Date(query.dateTo) : new Date();
    const start = query.dateFrom
      ? new Date(query.dateFrom)
      : this.addDays(end, -29);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('dateFrom and dateTo must be valid dates');
    }

    if (start > end) {
      throw new BadRequestException('dateFrom must be before or equal dateTo');
    }

    const normalizedStart = new Date(start);
    normalizedStart.setUTCHours(0, 0, 0, 0);

    const normalizedEnd = new Date(end);
    normalizedEnd.setUTCHours(23, 59, 59, 999);

    return {
      start: normalizedStart,
      end: normalizedEnd,
      groupBy: query.groupBy,
      top: query.top,
    };
  }

  private mapRange(range: AnalyticsRange): AnalyticsRangeResponseDto {
    return {
      start: range.start,
      end: range.end,
      groupBy: range.groupBy,
    };
  }

  private buildOverview(
    revenue: AnalyticsRevenueResponseDto,
    members: AnalyticsMemberResponseDto,
    operations: AnalyticsOperationsResponseDto,
  ): AnalyticsOverviewResponseDto {
    return {
      cards: [
        {
          key: 'collectedAmount',
          label: 'Collected Revenue',
          valueType: 'currency',
          value: revenue.collected.amount,
          currency: revenue.collected.currency,
        },
        {
          key: 'collectionRate',
          label: 'Collection Rate',
          valueType: 'percentage',
          value: revenue.collectionRate.percentage,
        },
        {
          key: 'currentMembers',
          label: 'Current Members',
          valueType: 'count',
          value: members.currentMembers,
        },
        {
          key: 'newMembers',
          label: 'New Members',
          valueType: 'count',
          value: members.newMembers,
        },
        {
          key: 'overdueAmount',
          label: 'Overdue Balance',
          valueType: 'currency',
          value: revenue.overdue.amount,
          currency: revenue.overdue.currency,
        },
        {
          key: 'activeLocations',
          label: 'Active Locations',
          valueType: 'count',
          value: operations.activeLocations,
        },
        {
          key: 'unreadNotifications',
          label: 'Unread Notifications',
          valueType: 'count',
          value: operations.unreadNotifications,
        },
        {
          key: 'auditEvents',
          label: 'Audit Events',
          valueType: 'count',
          value: operations.auditEvents,
        },
      ],
    };
  }

  private buildInsights(
    revenue: AnalyticsRevenueResponseDto,
    members: AnalyticsMemberResponseDto,
    operations: AnalyticsOperationsResponseDto,
  ): AnalyticsInsightResponseDto[] {
    const insights: AnalyticsInsightResponseDto[] = [];

    if (revenue.overdue.amount > 0) {
      insights.push({
        severity: revenue.overdue.amount >= revenue.collected.amount
          ? 'critical'
          : 'warning',
        metricKey: 'overdueAmount',
        title: 'Overdue balance needs attention',
        message:
          'There are overdue invoices that should be followed up soon to protect tenant cash flow.',
      });
    }

    if (revenue.collectionRate.percentage < 70) {
      insights.push({
        severity: 'warning',
        metricKey: 'collectionRate',
        title: 'Collection rate is below target',
        message:
          'Collected revenue is lagging behind invoices created in the selected period.',
      });
    }

    if (
      operations.scheduleCoverageRate.percentage < 60 &&
      members.activeMembers > 0
    ) {
      insights.push({
        severity: 'info',
        metricKey: 'scheduleCoverageRate',
        title: 'Schedule coverage can improve',
        message:
          'A relatively low share of active members currently has schedule availability registered.',
      });
    }

    if (operations.unreadNotifications >= 20) {
      insights.push({
        severity: 'info',
        metricKey: 'unreadNotifications',
        title: 'Notification queue is growing',
        message:
          'Unread notifications are accumulating and may hide important operational follow-up.',
      });
    }

    if (members.pendingInvitations > Math.max(members.newMembers, 0)) {
      insights.push({
        severity: 'info',
        metricKey: 'pendingInvitations',
        title: 'Pending invitations could convert into growth',
        message:
          'There are more pending invitations than recent member activations, which signals a conversion opportunity.',
      });
    }

    if (insights.length === 0) {
      insights.push({
        severity: 'success',
        metricKey: 'dashboardHealth',
        title: 'Tenant analytics look healthy',
        message:
          'Collection, operations and member coverage are currently within a healthy operating range.',
      });
    }

    return insights;
  }

  private buildPaymentStatusBreakdown(
    payments: AnalyticsPaymentRecord[],
  ): AnalyticsDimensionCountDto[] {
    const counts = new Map<string, number>();

    for (const payment of payments) {
      counts.set(payment.status, (counts.get(payment.status) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([key, count]) => ({
        key,
        label: this.humanizeKey(key),
        count,
      }));
  }

  private buildMemberStatusBreakdown(values: {
    activeMembers: number;
    invitedMembers: number;
    suspendedMembers: number;
    removedMembers: number;
  }): AnalyticsDimensionCountDto[] {
    return [
      {
        key: MemberStatus.ACTIVE,
        label: 'Active',
        count: values.activeMembers,
      },
      {
        key: MemberStatus.INVITED,
        label: 'Invited',
        count: values.invitedMembers,
      },
      {
        key: MemberStatus.SUSPENDED,
        label: 'Suspended',
        count: values.suspendedMembers,
      },
      {
        key: MemberStatus.REMOVED,
        label: 'Removed',
        count: values.removedMembers,
      },
    ];
  }

  private buildTopPaymentTypes(
    payments: AnalyticsPaymentRecord[],
    top: number,
    currency: string,
  ): AnalyticsDimensionAmountDto[] {
    const summary = new Map<
      string,
      { key: string; label: string; count: number; amount: number }
    >();

    for (const payment of payments) {
      const key = payment.paymentType?.key ?? 'untyped';
      const label = payment.paymentType?.name ?? 'Unassigned Payment Type';
      const existing = summary.get(key) ?? {
        key,
        label,
        count: 0,
        amount: 0,
      };

      existing.count += 1;
      existing.amount += this.decimalToNumber(payment.amount);
      summary.set(key, existing);
    }

    return [...summary.values()]
      .sort(
        (left, right) =>
          right.amount - left.amount || right.count - left.count || left.key.localeCompare(right.key),
      )
      .slice(0, top)
      .map((item) => ({
        ...item,
        currency,
      }));
  }

  private buildCollectedByMethod(
    transactions: AnalyticsTransactionRecord[],
    top: number,
    currency: string,
  ): AnalyticsDimensionAmountDto[] {
    const summary = new Map<
      string,
      { key: string; label: string; count: number; amount: number }
    >();

    for (const transaction of transactions) {
      const key = transaction.paymentMethod?.key ?? 'unknown';
      const label = transaction.paymentMethod?.name ?? 'Unknown Method';
      const existing = summary.get(key) ?? {
        key,
        label,
        count: 0,
        amount: 0,
      };

      existing.count += 1;
      existing.amount += this.decimalToNumber(transaction.amount);
      summary.set(key, existing);
    }

    return [...summary.values()]
      .sort(
        (left, right) =>
          right.amount - left.amount || right.count - left.count || left.key.localeCompare(right.key),
      )
      .slice(0, top)
      .map((item) => ({
        ...item,
        currency,
      }));
  }

  private buildTopAuditActions(
    records: Array<{ action: string }>,
    top: number,
  ): AnalyticsDimensionCountDto[] {
    const counts = new Map<string, number>();

    for (const record of records) {
      counts.set(record.action, (counts.get(record.action) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, top)
      .map(([key, count]) => ({
        key,
        label: this.humanizeKey(key),
        count,
      }));
  }

  private buildTrend(
    range: AnalyticsRange,
    data: {
      payments?: AnalyticsPaymentRecord[];
      transactions?: AnalyticsTransactionRecord[];
      members?: AnalyticsMemberRecord[];
      invitations?: AnalyticsInvitationRecord[];
    },
  ): AnalyticsTrendPointDto[] {
    const buckets = this.createBuckets(range);

    for (const payment of data.payments ?? []) {
      const bucketKey = this.getBucketKey(payment.createdAt, range.groupBy);
      const bucket = buckets.get(bucketKey);

      if (bucket) {
        bucket.invoicedAmount += this.decimalToNumber(payment.amount);
      }
    }

    for (const transaction of data.transactions ?? []) {
      if (transaction.status !== PaymentTransactionStatus.SUCCEEDED) {
        continue;
      }

      const effectiveDate = transaction.processedAt ?? transaction.createdAt;
      const bucketKey = this.getBucketKey(effectiveDate, range.groupBy);
      const bucket = buckets.get(bucketKey);

      if (bucket) {
        bucket.collectedAmount += this.decimalToNumber(transaction.amount);
      }
    }

    for (const member of data.members ?? []) {
      if (!member.joinedAt) {
        continue;
      }

      const bucketKey = this.getBucketKey(member.joinedAt, range.groupBy);
      const bucket = buckets.get(bucketKey);

      if (bucket) {
        bucket.newMembers += 1;
      }
    }

    for (const invitation of data.invitations ?? []) {
      const bucketKey = this.getBucketKey(invitation.createdAt, range.groupBy);
      const bucket = buckets.get(bucketKey);

      if (bucket) {
        bucket.invitations += 1;
      }
    }

    return [...buckets.values()];
  }

  private createBuckets(range: AnalyticsRange): Map<string, AnalyticsTrendPointDto> {
    const buckets = new Map<string, AnalyticsTrendPointDto>();
    let cursor = this.startOfBucket(range.start, range.groupBy);

    while (cursor <= range.end) {
      const bucketStart = new Date(cursor);
      const bucketEnd = this.endOfBucket(bucketStart, range.groupBy);
      const bucketKey = this.getBucketKey(bucketStart, range.groupBy);

      buckets.set(bucketKey, {
        bucket: bucketKey,
        start: bucketStart,
        end: bucketEnd,
        invoicedAmount: 0,
        collectedAmount: 0,
        newMembers: 0,
        invitations: 0,
      });

      cursor = this.nextBucket(bucketStart, range.groupBy);
    }

    return buckets;
  }

  private getBucketKey(date: Date, groupBy: AnalyticsGroupBy): string {
    const bucketStart = this.startOfBucket(date, groupBy);
    return bucketStart.toISOString().slice(0, 10);
  }

  private startOfBucket(date: Date, groupBy: AnalyticsGroupBy): Date {
    const result = new Date(date);
    result.setUTCHours(0, 0, 0, 0);

    if (groupBy === 'month') {
      result.setUTCDate(1);
      return result;
    }

    if (groupBy === 'week') {
      const currentDay = result.getUTCDay();
      const shift = currentDay === 0 ? -6 : 1 - currentDay;
      result.setUTCDate(result.getUTCDate() + shift);
    }

    return result;
  }

  private endOfBucket(date: Date, groupBy: AnalyticsGroupBy): Date {
    const next = this.nextBucket(date, groupBy);
    return new Date(next.getTime() - 1);
  }

  private nextBucket(date: Date, groupBy: AnalyticsGroupBy): Date {
    const next = new Date(date);

    if (groupBy === 'month') {
      next.setUTCMonth(next.getUTCMonth() + 1, 1);
      next.setUTCHours(0, 0, 0, 0);
      return next;
    }

    next.setUTCDate(next.getUTCDate() + (groupBy === 'week' ? 7 : 1));
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }

  private sumPaymentAmounts(payments: AnalyticsPaymentRecord[]): number {
    return payments.reduce(
      (total, payment) => total + this.decimalToNumber(payment.amount),
      0,
    );
  }

  private sumTransactionAmounts(transactions: AnalyticsTransactionRecord[]): number {
    return transactions.reduce(
      (total, transaction) => total + this.decimalToNumber(transaction.amount),
      0,
    );
  }

  private sumOutstandingBalances(payments: AnalyticsPaymentRecord[]): number {
    return payments.reduce((total, payment) => total + this.getOutstandingBalance(payment), 0);
  }

  private getOutstandingBalance(payment: AnalyticsPaymentRecord): number {
    const paidAmount = payment.transactions
      .filter((transaction) => transaction.status === PaymentTransactionStatus.SUCCEEDED)
      .reduce(
        (total, transaction) => total + this.decimalToNumber(transaction.amount),
        0,
      );

    return Math.max(this.decimalToNumber(payment.amount) - paidAmount, 0);
  }

  private resolveCurrency(
    paymentCurrencies: string[],
    transactionCurrencies: string[],
  ): string {
    return paymentCurrencies[0] ?? transactionCurrencies[0] ?? 'USD';
  }

  private toMoneyMetric(amount: number, currency: string): AnalyticsMoneyMetricDto {
    return {
      amount: this.roundToTwo(amount),
      currency,
    };
  }

  private toRateMetric(percentage: number): AnalyticsRateMetricDto {
    return {
      percentage: this.roundToTwo(percentage),
    };
  }

  private decimalToNumber(value: Prisma.Decimal): number {
    return Number(value);
  }

  private roundToTwo(value: number): number {
    return Number(value.toFixed(2));
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private humanizeKey(value: string): string {
    return value
      .split(/[._-]/g)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
}
