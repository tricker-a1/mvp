import fastifyMultipart from '@fastify/multipart';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './filters/global-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger:
        process.env.NODE_ENV === 'development'
          ? {
              transport: {
                target: 'pino-pretty',
              },
            }
          : false,
    }),
  );
  app.enableCors();

  const PORT = process.env.PORT;

  app.setGlobalPrefix('api');
  app.register(fastifyMultipart.default, { addToBody: true });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CryptoPerk API')
    .setVersion('v1.0')
    .setExternalDoc('Json document', `http://localhost:${PORT}/swagger-json`)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(PORT, '0.0.0.0');
}
bootstrap();
