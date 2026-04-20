import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Agoge Central Managua' })
  @IsString()
  @Length(2, 160)
  name: string;

  @ApiPropertyOptional({ example: 'Los Robles, Managua, Nicaragua' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description:
      'IANA timezone for this location. Defaults to America/Managua for Nicaragua.',
    example: 'America/Managua',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'Agoge Central Managua' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @ApiPropertyOptional({ example: 'Los Robles, Managua, Nicaragua' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'America/Managua' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
