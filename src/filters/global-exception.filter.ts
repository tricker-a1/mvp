import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let code = exception.status;
    let message = exception.response?.message || '';

    if (!code) {
      code = 400;
    }

    if (message === 'Http Exception') {
      message = exception.response.messages;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      message = exception.meta?.message
        ? `${exception.meta?.message}`
        : `${exception.cause}`;

      if (exception.code === 'P2002') {
        message = 'There is a unique constraint violation';
      }
      if (exception.code === 'P2022') {
        message = `The column \`${exception.meta.column}\` does not exist in the current database.`;
      }
    }

    if (!message || message == 'undefined') {
      message = exception.message || exception.messages;
    }

    response.status(code).send(message);
  }
}
