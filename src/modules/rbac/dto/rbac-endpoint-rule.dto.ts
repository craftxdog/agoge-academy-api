import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
] as const;

const RBAC_KEY_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export class CreateEndpointPermissionRuleDto {
  @ApiProperty({ enum: HTTP_METHODS, example: 'POST' })
  @IsString()
  @IsIn(HTTP_METHODS)
  method: string;

  @ApiProperty({
    example: '/billing/payments/:paymentId/transactions',
    description:
      'API path without global prefix. Dynamic segments use Nest-style :param notation.',
  })
  @IsString()
  @Length(2, 300)
  @Matches(/^\/[a-zA-Z0-9/_:.-]*$/)
  pathPattern: string;

  @ApiProperty({ example: 'billing.transactions.create' })
  @IsString()
  @Length(3, 120)
  @Matches(RBAC_KEY_PATTERN)
  permissionKey: string;

  @ApiPropertyOptional({
    example: 'Allows recording a payment transaction.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class EndpointPermissionRuleResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'POST' })
  method: string;

  @ApiProperty({ example: '/billing/payments/:paymentId/transactions' })
  pathPattern: string;

  @ApiProperty({ example: 'billing.transactions.create' })
  permissionKey: string;

  @ApiPropertyOptional({ example: 'Allows recording a payment transaction.' })
  description?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-05-09T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-09T00:00:00.000Z' })
  updatedAt: Date;
}
