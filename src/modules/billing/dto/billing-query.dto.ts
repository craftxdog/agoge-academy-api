import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  PaymentStatus,
  PaymentTransactionStatus,
} from 'generated/prisma/enums';
import { CursorPaginationQueryDto } from '../../../common';

export const PAYMENT_SORT_FIELDS = ['createdAt', 'dueDate', 'status'] as const;
export type PaymentSortField = (typeof PAYMENT_SORT_FIELDS)[number];

export class BillingCatalogQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'membership' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class PaymentQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  paymentTypeId?: string;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString()
  dueFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsDateString()
  dueTo?: string;

  @ApiPropertyOptional({
    enum: PAYMENT_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(PAYMENT_SORT_FIELDS)
  override sortBy: PaymentSortField = 'createdAt';
}

export class PaymentTransactionQueryDto {
  @ApiPropertyOptional({ enum: PaymentTransactionStatus })
  @IsOptional()
  @IsEnum(PaymentTransactionStatus)
  status?: PaymentTransactionStatus;
}
