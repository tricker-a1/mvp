import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { User as UserDecorator } from '../decorators/user.decorator.js';
import { MagicGuard } from './magic.guard.js';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(MagicGuard)
  @Post('login')
  async login(@UserDecorator() user) {
    return user;
  }
}
