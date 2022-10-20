import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class SendKudosDto {
  @ApiProperty()
  @IsUUID(4)
  recipient: string;

  @ApiProperty()
  @IsNumber()
  value: number;
}

export class DateRangeDto {
  @ApiProperty()
  @IsOptional()
  @IsDateString()
  from: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  to: number;
}
