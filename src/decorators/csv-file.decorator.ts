import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const CSVFile = createParamDecorator(
  async (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest() as FastifyRequest;
    const body: any = await req.body;
    const file = body.file?.[0];
    if (!file) {
      return;
    }
    if (!file.mimetype.includes('csv')) {
      throw new BadRequestException('Filetype must be csv');
    }

    return file;
  },
);
