import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentTypeResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'monthly-membership' })
  key: string;

  @ApiProperty({ example: 'Monthly Membership' })
  name: string;

  @ApiPropertyOptional({ example: 'Recurring monthly academy membership.' })
  description?: string | null;

  @ApiPropertyOptional({ example: '45.00' })
  amount?: string | null;

  @ApiProperty({ example: 'NIO' })
  currency: string;

  @ApiProperty({ example: 'MONTHLY' })
  frequency: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: { graceDays: 5 } })
  config?: unknown;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class PaymentMethodResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'cash' })
  key: string;

  @ApiProperty({ example: 'Cash' })
  name: string;

  @ApiPropertyOptional({ example: 'Manual cash payment at reception.' })
  description?: string | null;

  @ApiProperty({ example: false })
  requiresReference: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: { requiresCashbox: true } })
  config?: unknown;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class BillingMemberSummaryDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'founder@agoge.com' })
  email: string;

  @ApiProperty({ example: 'Alex' })
  firstName: string;

  @ApiProperty({ example: 'Founder' })
  lastName: string;
}

export class PaymentTransactionResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: '45.00' })
  amount: string;

  @ApiProperty({ example: 'NIO' })
  currency: string;

  @ApiProperty({ example: 'SUCCEEDED' })
  status: string;

  @ApiPropertyOptional({ example: 'BAC-123456' })
  reference?: string | null;

  @ApiPropertyOptional({ type: PaymentMethodResponseDto })
  paymentMethod?: PaymentMethodResponseDto | null;

  @ApiPropertyOptional({ example: '2026-04-20T02:00:00.000Z' })
  processedAt?: Date | null;

  @ApiPropertyOptional({ example: { cashier: 'front-desk' } })
  metadata?: unknown;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;
}

export class PaymentResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'INV-2026-00001' })
  invoiceNumber?: string | null;

  @ApiProperty({ example: '45.00' })
  amount: string;

  @ApiProperty({ example: 'NIO' })
  currency: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: '2026-04-30T00:00:00.000Z' })
  dueDate: Date;

  @ApiPropertyOptional({ example: '2026-04-20T02:00:00.000Z' })
  paidAt?: Date | null;

  @ApiPropertyOptional({ example: 4 })
  periodMonth?: number | null;

  @ApiPropertyOptional({ example: 2026 })
  periodYear?: number | null;

  @ApiPropertyOptional({ example: 'April membership fee.' })
  notes?: string | null;

  @ApiPropertyOptional({ example: { source: 'manual' } })
  metadata?: unknown;

  @ApiProperty({ type: BillingMemberSummaryDto })
  member: BillingMemberSummaryDto;

  @ApiPropertyOptional({ type: PaymentTypeResponseDto })
  paymentType?: PaymentTypeResponseDto | null;

  @ApiProperty({ example: '0.00' })
  paidAmount: string;

  @ApiProperty({ example: '45.00' })
  balance: string;

  @ApiProperty({ type: [PaymentTransactionResponseDto] })
  transactions: PaymentTransactionResponseDto[];

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class BillingSummaryResponseDto {
  @ApiProperty({ example: 10 })
  openPayments: number;

  @ApiProperty({ example: '450.00' })
  openBalance: string;

  @ApiProperty({ example: 4 })
  overduePayments: number;

  @ApiProperty({ example: '180.00' })
  overdueBalance: string;

  @ApiProperty({ example: '1200.00' })
  paidThisMonth: string;
}
