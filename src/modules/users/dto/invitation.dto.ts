import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'coach@agoge.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Invitation expiration in days.',
    default: 7,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Raw invitation token received by the invited user.',
    example: 'gk9N9x8LhX...',
  })
  @IsString()
  @MinLength(20)
  token: string;

  @ApiPropertyOptional({
    description: 'Unique platform username for new accounts.',
    example: 'coach.alex',
  })
  @IsOptional()
  @IsString()
  @Length(3, 40)
  username?: string;

  @ApiProperty({ example: 'Alex' })
  @IsString()
  @Length(2, 80)
  firstName: string;

  @ApiProperty({ example: 'Coach' })
  @IsString()
  @Length(2, 80)
  lastName: string;

  @ApiProperty({
    description:
      'Required for new platform users. Existing invited users keep their current password.',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ example: '+50588889999' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '001-010190-0001A' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentId?: string;

  @ApiPropertyOptional({ example: 'Managua, Nicaragua' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
