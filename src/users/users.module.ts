import { Module } from '@nestjs/common';
import { SendgridService } from '../sendgrid/sendgrid.service.js';
import { StripeService } from '../stripe/stripe.service.js';
import { TatumModule } from '../tatum/tatum.module.js';
import { PrismaService } from '../prisma.service.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { ConfigService } from '@nestjs/config';
import { CompaniesModule } from '../companies/companies.module.js';

@Module({
  imports: [TatumModule, CompaniesModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    StripeService,
    SendgridService,
    ConfigService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
