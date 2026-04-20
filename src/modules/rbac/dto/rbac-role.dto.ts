import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description:
      'Tenant-scoped stable key. Use lowercase kebab-case or dot notation.',
    example: 'front-desk',
  })
  @IsString()
  @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)
  key: string;

  @ApiProperty({ example: 'Front Desk' })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiPropertyOptional({
    example: 'Can manage member check-ins and basic user information.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Marks this role as the suggested default for new members.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Permission keys granted to this role.',
    example: ['users.read', 'schedules.read'],
    maxItems: 200,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  permissionKeys?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Front Desk Lead' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Can manage member check-ins, schedules and basic user records.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Marks this role as the suggested default for new members.',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ReplaceRolePermissionsDto {
  @ApiProperty({
    description: 'Complete replacement list of permission keys for the role.',
    example: ['settings.read', 'users.read', 'users.write'],
    maxItems: 200,
  })
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  permissionKeys: string[];
}

export class ReplaceMemberRolesDto {
  @ApiProperty({
    description:
      'Complete replacement list of tenant role keys for the member.',
    example: ['front-desk', 'customer'],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  roleKeys: string[];
}
