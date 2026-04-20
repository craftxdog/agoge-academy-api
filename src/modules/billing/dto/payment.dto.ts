import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PaymentStatus,
  PaymentTransactionStatus,
} from 'generated/prisma/enums';

export class CreatePaymentDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsString()
  memberId: string;

  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  paymentTypeId?: string;

  @ApiPropertyOptional({ example: 'INV-2026-00001' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description:
      'Required when paymentTypeId has no default amount or is omitted. Money is sent as string.',
    example: '45.00',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  amount?: string;

  @ApiPropertyOptional({ example: 'NIO' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiProperty({ example: '2026-04-30' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth?: number;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2200)
  periodYear?: number;

  @ApiPropertyOptional({ example: 'April membership fee.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: { source: 'manual' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'April membership fee.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: { source: 'manual' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreatePaymentTransactionDto {
  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({ example: '45.00' })
  @IsDecimal({ decimal_digits: '0,2' })
  amount: string;

  @ApiPropertyOptional({ example: 'NIO' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ enum: PaymentTransactionStatus })
  @IsOptional()
  @IsEnum(PaymentTransactionStatus)
  status?: PaymentTransactionStatus;

  @ApiPropertyOptional({ example: 'BAC-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional({ example: '2026-04-20T02:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  processedAt?: string;

  @ApiPropertyOptional({ example: { cashier: 'front-desk' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
