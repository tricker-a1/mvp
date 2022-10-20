import { Module } from '@nestjs/common';
import { KudosService } from './kudos.service.js';
import { KudosController } from './kudos.controller.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [KudosController],
  providers: [KudosService, PrismaService],
})
export class KudosModule {}
