import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaymentFrequency } from 'generated/prisma/enums';

const KEY_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export class CreatePaymentTypeDto {
  @ApiProperty({ example: 'monthly-membership' })
  @IsString()
  @Length(2, 80)
  @Matches(KEY_PATTERN)
  key: string;

  @ApiProperty({ example: 'Monthly Membership' })
  @IsString()
  @Length(2, 160)
  name: string;

  @ApiPropertyOptional({ example: 'Recurring monthly academy membership.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description:
      'Default amount for this payment type. Money is sent as string.',
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

  @ApiPropertyOptional({ enum: PaymentFrequency })
  @IsOptional()
  @IsEnum(PaymentFrequency)
  frequency?: PaymentFrequency;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { graceDays: 5 } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdatePaymentTypeDto {
  @ApiPropertyOptional({ example: 'Monthly Membership' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @ApiPropertyOptional({ example: 'Recurring monthly academy membership.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '45.00' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  amount?: string;

  @ApiPropertyOptional({ example: 'NIO' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ enum: PaymentFrequency })
  @IsOptional()
  @IsEnum(PaymentFrequency)
  frequency?: PaymentFrequency;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { graceDays: 5 } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'cash' })
  @IsString()
  @Length(2, 80)
  @Matches(KEY_PATTERN)
  key: string;

  @ApiProperty({ example: 'Cash' })
  @IsString()
  @Length(2, 160)
  name: string;

  @ApiPropertyOptional({ example: 'Manual cash payment at reception.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requiresReference?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { requiresCashbox: true } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ example: 'Cash' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @ApiPropertyOptional({ example: 'Manual cash payment at reception.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requiresReference?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { requiresCashbox: true } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
