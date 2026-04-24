import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

const RBAC_KEY_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export class CreatePermissionDto {
  @ApiProperty({
    description:
      'Stable global permission key. Use lowercase dot notation or kebab-case.',
    example: 'schedules.write',
  })
  @IsString()
  @Length(3, 120)
  @Matches(RBAC_KEY_PATTERN)
  key: string;

  @ApiProperty({ example: 'Write schedules' })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiPropertyOptional({
    example: 'Allows creating and updating member schedules.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional module key that owns this permission.',
    example: 'schedules',
  })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  @Matches(RBAC_KEY_PATTERN)
  moduleKey?: string;
}
