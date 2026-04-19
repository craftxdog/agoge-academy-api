import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SwitchOrganizationDto {
  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'agoge-academy' })
  @IsOptional()
  @IsString()
  organizationSlug?: string;
}
