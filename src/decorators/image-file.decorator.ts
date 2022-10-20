import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const ImageFile = createParamDecorator(
  async (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest() as FastifyRequest;
    const file = await req.file();
    if (!file?.mimetype.includes('image')) {
      throw new BadRequestException('Filetype must be image');
    }
    return file;
  },
);
