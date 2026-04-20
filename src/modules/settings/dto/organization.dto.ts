import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateOrganizationProfileDto {
  @ApiPropertyOptional({ example: 'Agoge Academy' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @ApiPropertyOptional({ example: 'Agoge Academy S.A.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @ApiPropertyOptional({ example: 'J0310000000000' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  taxId?: string;

  @ApiPropertyOptional({ example: 'America/Managua' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @ApiPropertyOptional({ example: 'es-NI' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @ApiPropertyOptional({ example: 'NIO' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  defaultCurrency?: string;
}
