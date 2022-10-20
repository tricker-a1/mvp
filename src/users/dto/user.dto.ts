import { ApiProperty } from '@nestjs/swagger';
import { Card, Permission, Role } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { CreateCompanyDto } from '../../companies/dto/company.dto.js';
import { UpdatePaymentMethodDto } from '../../stripe/dto/stripe.dto.js';
import crypto from 'crypto';

export class UsersInfoSA {
  firstname: string;
  lastname: string;
  avatar: string;
  email: string;
  role: Role;
  cardExpiringDate?: string;
  company: {
    name: string;
    logo: string;
    size: number;
  };
  addresses: string[];
  country?: string;
  isEnrolled: boolean;
  isFired: boolean;
  cards?: Card[];
  customerId?: string;
}

export class UserInfoSA {
  firstname: string;
  lastname: string;
  avatar: string;
  email: string;
  role: Role;
  cardExpiringDate?: string;
  company: {
    name: string;
    logo: string;
    size: number;
    website?: string;
    country?: string;
  };
  addresses: string[];
  isEnrolled: boolean;
  isFired: boolean;
  cards?: Card[];
  customerId?: string;
}

export class GetUsersDto {
  @ApiProperty()
  @IsNumberString()
  page: string;
}

export class InviteEmployeesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ each: true })
  emails: string[];
}

export class InviteAdminsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ each: true })
  emails: string[];
}

export class RegisterEmployeeDto {
  @ApiProperty({ example: 'email@gmail.com' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'User' })
  @IsString()
  firstname: string;

  @ApiProperty({ example: '1' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: 'user' + crypto.randomUUID() })
  @IsString()
  username: string;

  @ApiProperty({ example: 'email2@gmail.com' })
  @IsString()
  @IsEmail()
  recoveringEmail: string;
}

export class CreateWalletDto {
  @ApiProperty({
    example:
      'elbow faith eye orbit list offer attitude delay amused vote sun crisp sek juice inside prevent gain female dutch voyage fee siege such crowd',
    required: false,
  })
  @IsOptional()
  @IsString()
  mnemonic: string;
}

export class RegisterAdminDto {
  @ApiProperty({ example: 'email@gmail.com' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'User' })
  @IsString()
  firstname: string;

  @ApiProperty({ example: '1' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: 'user' + crypto.randomUUID() })
  @IsString()
  username: string;
}

export class CompleteEmployeeRegistrationDto {
  @ApiProperty({ example: new Date('2000') })
  @IsDateString()
  dateOfBirth: Date;

  @ApiProperty({ example: new Date('2019') })
  @IsDateString()
  startOfWork: Date;
}

export class CompleteAdminRegistrationDto {
  @ApiProperty({ example: new Date('2000') })
  @IsDateString()
  dateOfBirth: Date;

  @ApiProperty({ example: new Date('2019') })
  @IsDateString()
  startOfWork: Date;

  @ApiProperty({ type: CreateCompanyDto })
  companyDto: CreateCompanyDto;
}

export class CreateSuperAdminDto {
  @ApiProperty({ example: 'super@gmail.com' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Qwerty' })
  @IsString()
  firstname: string;

  @ApiProperty({ example: 'X' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: Role.SuperAdmin })
  @IsEnum(Role)
  @Matches(Role.SuperAdmin)
  role: Role;
}

export class UpdateMyProfileDto {
  @ApiProperty({ example: 'email@gmail.com', required: false })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'User', required: false })
  @IsString()
  @IsOptional()
  firstname?: string;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  lastname?: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'null' }],
    example: null,
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string | null;

  @ApiProperty({
    example: 'user' + crypto.randomUUID(),
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: new Date('2019'), required: false })
  @IsDateString()
  @IsOptional()
  startOfWork?: Date;

  @ApiProperty({ example: new Date('2000'), required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty({
    example: '+0123456789',
    required: false,
  })
  @IsString()
  // @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isFired?: boolean;
}

export class UpdateSuperAdminInfoDto {
  @ApiProperty({ example: 'super@gmail.com', required: false })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Qwerty', required: false })
  @IsString()
  @IsOptional()
  firstname?: string;

  @ApiProperty({ example: 'X', required: false })
  @IsString()
  @IsOptional()
  lastname?: string;
}

export class ChangeUserRole {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ oneOf: [{ example: Role.Employee }, { example: Role.Admin }] })
  @IsEnum(Role)
  role: Role;

  permissions?: Permission[];
}

export class SetUserPermissions {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({
    example: [
      Permission.InviteEmployees,
      Permission.ManageBillingInformation,
      Permission.SetPermissionsForOthers,
    ],
  })
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}

export class AddUserCardDto {
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

export class UpdateUserCardDto extends UpdatePaymentMethodDto {}

export class GetCardsInfo {
  id: string;
  isDefault: boolean;
  last4: string;
  exp_month: number;
  exp_year: number;
  brand: string;
}
