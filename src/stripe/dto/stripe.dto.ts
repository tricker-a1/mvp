import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreatePaymentMethodDto {
  @ApiProperty()
  @IsString()
  customerId: string;

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

export class UpdatePaymentMethodDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  month: number;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  year: number;
}
