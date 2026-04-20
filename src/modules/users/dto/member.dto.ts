import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MemberStatus } from 'generated/prisma/enums';

export class CreateMemberDto {
  @ApiProperty({ example: 'coach@agoge.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Unique platform username for new accounts.',
    example: 'coach.alex',
  })
  @IsOptional()
  @IsString()
  @Length(3, 40)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  username?: string;

  @ApiProperty({ example: 'Alex' })
  @IsString()
  @Length(2, 80)
  firstName: string;

  @ApiProperty({ example: 'Coach' })
  @IsString()
  @Length(2, 80)
  lastName: string;

  @ApiPropertyOptional({
    description:
      'Required only when the email does not belong to an existing platform user.',
    example: 'Password123!',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

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

  @ApiPropertyOptional({
    description:
      'Initial role keys. When omitted, the tenant default role is assigned when available.',
    example: ['coach'],
    maxItems: 50,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  roleKeys?: string[];
}

export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 'Alex' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Coach' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  lastName?: string;

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

export class UpdateMemberStatusDto {
  @ApiProperty({
    enum: [MemberStatus.ACTIVE, MemberStatus.SUSPENDED],
    example: MemberStatus.SUSPENDED,
  })
  @IsIn([MemberStatus.ACTIVE, MemberStatus.SUSPENDED])
  status: MemberStatus;
}
