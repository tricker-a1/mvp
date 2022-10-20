import { Module } from '@nestjs/common';
import { TatumService } from './tatum.service.js';

@Module({
  controllers: [],
  providers: [TatumService],
  exports: [TatumService],
})
export class TatumModule {}
