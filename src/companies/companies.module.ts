import { Module } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service.js';
import { PrismaService } from '../prisma.service.js';
import { CompaniesController } from './companies.controller.js';
import { CompaniesService } from './companies.service.js';
import { TatumModule } from '../tatum/tatum.module.js';

@Module({
  imports: [TatumModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, PrismaService, StripeService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
