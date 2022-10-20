import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { PrismaService } from './prisma.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { GlobalExceptionFilter } from './filters/global-exception.filter.js';
import { StripeModule } from './stripe/stripe.module.js';
import { TatumModule } from './tatum/tatum.module.js';
import { KudosModule } from './kudos/kudos.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UsersModule,
    AuthModule,
    CompaniesModule,
    StripeModule,
    TatumModule,
    KudosModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    PrismaService,
  ],
})
export class AppModule {}
