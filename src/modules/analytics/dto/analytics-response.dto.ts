import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsRangeResponseDto {
  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  start: Date;

  @ApiProperty({ example: '2026-04-30T23:59:59.999Z' })
  end: Date;

  @ApiProperty({ example: 'day' })
  groupBy: string;
}

export class AnalyticsMoneyMetricDto {
  @ApiProperty({ example: 2450.75 })
  amount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;
}

export class AnalyticsRateMetricDto {
  @ApiProperty({ example: 82.5 })
  percentage: number;
}

export class AnalyticsDimensionCountDto {
  @ApiProperty({ example: 'active' })
  key: string;

  @ApiProperty({ example: 'Active' })
  label: string;

  @ApiProperty({ example: 42 })
  count: number;
}

export class AnalyticsDimensionAmountDto {
  @ApiProperty({ example: 'transfer' })
  key: string;

  @ApiProperty({ example: 'Bank Transfer' })
  label: string;

  @ApiProperty({ example: 10 })
  count: number;

  @ApiProperty({ example: 1350.5 })
  amount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;
}

export class AnalyticsTrendPointDto {
  @ApiProperty({ example: '2026-04-01' })
  bucket: string;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  start: Date;

  @ApiProperty({ example: '2026-04-01T23:59:59.999Z' })
  end: Date;

  @ApiProperty({ example: 900 })
  invoicedAmount: number;

  @ApiProperty({ example: 750 })
  collectedAmount: number;

  @ApiProperty({ example: 4 })
  newMembers: number;

  @ApiProperty({ example: 3 })
  invitations: number;
}

export class AnalyticsRevenueResponseDto {
  @ApiProperty({ type: AnalyticsRangeResponseDto })
  range: AnalyticsRangeResponseDto;

  @ApiProperty({ type: AnalyticsMoneyMetricDto })
  invoiced: AnalyticsMoneyMetricDto;

  @ApiProperty({ type: AnalyticsMoneyMetricDto })
  collected: AnalyticsMoneyMetricDto;

  @ApiProperty({ type: AnalyticsMoneyMetricDto })
  outstanding: AnalyticsMoneyMetricDto;

  @ApiProperty({ type: AnalyticsMoneyMetricDto })
  overdue: AnalyticsMoneyMetricDto;

  @ApiProperty({ type: AnalyticsRateMetricDto })
  collectionRate: AnalyticsRateMetricDto;

  @ApiProperty({ type: [AnalyticsDimensionCountDto] })
  statusBreakdown: AnalyticsDimensionCountDto[];

  @ApiProperty({ type: [AnalyticsDimensionAmountDto] })
  topPaymentTypes: AnalyticsDimensionAmountDto[];

  @ApiProperty({ type: [AnalyticsDimensionAmountDto] })
  collectedByMethod: AnalyticsDimensionAmountDto[];

  @ApiProperty({ type: [AnalyticsTrendPointDto] })
  trend: AnalyticsTrendPointDto[];
}

export class AnalyticsMemberResponseDto {
  @ApiProperty({ type: AnalyticsRangeResponseDto })
  range: AnalyticsRangeResponseDto;

  @ApiProperty({ example: 120 })
  currentMembers: number;

  @ApiProperty({ example: 95 })
  activeMembers: number;

  @ApiProperty({ example: 8 })
  invitedMembers: number;

  @ApiProperty({ example: 12 })
  suspendedMembers: number;

  @ApiProperty({ example: 5 })
  removedMembers: number;

  @ApiProperty({ example: 14 })
  newMembers: number;

  @ApiProperty({ example: 9 })
  pendingInvitations: number;

  @ApiProperty({ example: 11 })
  acceptedInvitations: number;

  @ApiProperty({ type: AnalyticsRateMetricDto })
  invitationAcceptanceRate: AnalyticsRateMetricDto;

  @ApiProperty({ type: [AnalyticsDimensionCountDto] })
  statusBreakdown: AnalyticsDimensionCountDto[];

  @ApiProperty({ type: [AnalyticsTrendPointDto] })
  trend: AnalyticsTrendPointDto[];
}

export class AnalyticsOperationsResponseDto {
  @ApiProperty({ type: AnalyticsRangeResponseDto })
  range: AnalyticsRangeResponseDto;

  @ApiProperty({ example: 3 })
  totalLocations: number;

  @ApiProperty({ example: 2 })
  activeLocations: number;

  @ApiProperty({ example: 18 })
  businessHourWindows: number;

  @ApiProperty({ example: 42 })
  memberScheduleWindows: number;

  @ApiProperty({ example: 33 })
  scheduledMembers: number;

  @ApiProperty({ type: AnalyticsRateMetricDto })
  scheduleCoverageRate: AnalyticsRateMetricDto;

  @ApiProperty({ example: 7 })
  unreadNotifications: number;

  @ApiProperty({ example: 2 })
  upcomingExceptions: number;

  @ApiProperty({ example: 96 })
  auditEvents: number;

  @ApiProperty({ example: 7 })
  enabledModulesCount: number;

  @ApiProperty({ example: ['settings', 'users', 'analytics'] })
  enabledModules: string[];

  @ApiProperty({ type: [AnalyticsDimensionCountDto] })
  topAuditActions: AnalyticsDimensionCountDto[];
}

export class AnalyticsOverviewCardDto {
  @ApiProperty({ example: 'collectedAmount' })
  key: string;

  @ApiProperty({ example: 'Collected Revenue' })
  label: string;

  @ApiProperty({ example: 'currency' })
  valueType: string;

  @ApiProperty({ example: 1800.5 })
  value: number;

  @ApiPropertyOptional({ example: 'USD' })
  currency?: string;
}

export class AnalyticsOverviewResponseDto {
  @ApiProperty({ type: [AnalyticsOverviewCardDto] })
  cards: AnalyticsOverviewCardDto[];
}

export class AnalyticsInsightResponseDto {
  @ApiProperty({ example: 'warning' })
  severity: string;

  @ApiProperty({ example: 'overdueAmount' })
  metricKey: string;

  @ApiProperty({ example: 'Overdue balance needs attention' })
  title: string;

  @ApiProperty({
    example:
      'There are overdue invoices that should be collected soon to protect cash flow.',
  })
  message: string;
}

export class AnalyticsDashboardResponseDto {
  @ApiProperty({ example: '2026-04-21T12:00:00.000Z' })
  generatedAt: Date;

  @ApiProperty({ type: AnalyticsRangeResponseDto })
  range: AnalyticsRangeResponseDto;

  @ApiProperty({ type: AnalyticsOverviewResponseDto })
  overview: AnalyticsOverviewResponseDto;

  @ApiProperty({ type: AnalyticsRevenueResponseDto })
  revenue: AnalyticsRevenueResponseDto;

  @ApiProperty({ type: AnalyticsMemberResponseDto })
  members: AnalyticsMemberResponseDto;

  @ApiProperty({ type: AnalyticsOperationsResponseDto })
  operations: AnalyticsOperationsResponseDto;

  @ApiProperty({ type: [AnalyticsInsightResponseDto] })
  insights: AnalyticsInsightResponseDto[];
}

export class AnalyticsCatalogItemDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'payments' })
  key: string;

  @ApiProperty({ example: 'Payments' })
  label: string;
}

export class AnalyticsCatalogResponseDto {
  @ApiProperty({ type: [AnalyticsCatalogItemDto] })
  paymentTypes: AnalyticsCatalogItemDto[];

  @ApiProperty({ type: [AnalyticsCatalogItemDto] })
  paymentMethods: AnalyticsCatalogItemDto[];

  @ApiProperty({ type: [AnalyticsCatalogItemDto] })
  locations: AnalyticsCatalogItemDto[];

  @ApiProperty({ example: ['USD', 'NIO'] })
  currencies: string[];

  @ApiProperty({ example: ['settings', 'users', 'analytics'] })
  enabledModules: string[];
}
