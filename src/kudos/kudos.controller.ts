import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { KudosService } from './kudos.service.js';
import { User as UserDecorator } from '../decorators/user.decorator.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DateRangeDto, SendKudosDto } from './dto/kudos.dto.js';
import { MagicGuard } from '../auth/magic.guard.js';

@ApiTags('kudos')
@UseGuards(MagicGuard)
@Controller('kudos')
export class KudosController {
  constructor(private readonly kudosService: KudosService) {}

  @ApiOperation({ summary: 'Send Kudos' })
  @Post()
  send(@Body() dto: SendKudosDto, @UserDecorator() user) {
    return this.kudosService.send(dto, user);
  }

  @ApiOperation({ summary: 'Get transactions' })
  @Post('statistic')
  getTransaction(@Body() range: DateRangeDto, @UserDecorator() user) {
    return this.kudosService.getTransactionFromUser(range, user);
  }
}
