import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Card, Role } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BalanceObject } from '../../tatum/types/types.js';
import { UpdatePaymentMethodDto } from '../../stripe/dto/stripe.dto.js';

export class CompanyInfoSA {
  id: string;
  name: string;
  industry: {
    value: string;
  };
  logo: string | null;
  website: string | null;
  country?: string;
  billingAdmin?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    avatar: string | null;
  };
  _count: {
    users: number;
  };
  enrolledUsers?: number;
  cardExpiringDate?: string | null;
  cards?: Card[];
  customerId?: string;
}

export class CompanyUsersInfo {
  firstname: string;
  lastname: string;
  avatar: string;
  email: string;
  role: Role;
  isEnrolled: boolean;
  addresses: string[];
}

export class CompanyUserInfo {
  id: string;
  issuer: string;
  firstname: string;
  lastname: string;
  avatar: string;
  email: string;
  role: Role;
  isEnrolled: boolean;
  isFired: boolean;
  phone: string;
  dateOfBirth: Date;
  startOfWork: Date;
  addresses: string[];
  balance?: BalanceObject;
}

export class GetCompaniesDto {
  @ApiProperty()
  @IsNumberString()
  page: string;
}

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  industryId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  size: number;
}

export class UpdateCompanyInfoDto {
  @ApiProperty({ example: 'New Company' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'null' }],
    example: null,
    required: false,
  })
  @IsString()
  @IsOptional()
  logo?: string | null;

  @ApiProperty({ required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  hashtags?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: 50, required: false })
  @IsNumber()
  @IsOptional()
  size: number;

  @ApiProperty({ example: '#111111', required: false })
  @IsString()
  @IsOptional()
  brandColor?: string;

  @ApiProperty({
    example: false,
    description: 'By default true',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  includeLogoOnWall?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  linkedin?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  twitter?: string;
}

export class FireUsersDto {
  @ApiProperty()
  @IsArray()
  @IsUUID('4', { each: true })
  users: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class AddCompanyCardDto {
  @ApiProperty({ example: 'Firstname' })
  @IsString()
  firstname: string;

  @ApiProperty({ example: 'Lastname' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: '4242424242424242' })
  @IsString()
  number: string;

  @ApiProperty({ example: 9 })
  @IsNumber()
  month: number;

  @ApiProperty({ example: 2023 })
  @IsNumber()
  year: number;

  @ApiProperty({ example: '314' })
  @IsString()
  cvc: string;

  @ApiProperty({ example: 'true' })
  @IsBoolean()
  isDefault: boolean;
}

export class UpdateCompanyCardDto extends UpdatePaymentMethodDto {}

export class GetCardsInfo {
  id: string;
  isDefault: boolean;
  last4: string;
  exp_month: number;
  exp_year: number;
  brand: string;
}
