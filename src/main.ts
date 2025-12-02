import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.use(helmet());

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.use(cookieParser(process.env.COOKIE_SECRET ?? 'SUPER_SECRET'));

  app.enableShutdownHooks();

  app.set('trust proxy', true);

  app.getHttpAdapter().getInstance().disable('etag');

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
      'https://scituinsk.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );

  console.log(process.env.CORS_ORIGINS?.split(','));
}
bootstrap();
