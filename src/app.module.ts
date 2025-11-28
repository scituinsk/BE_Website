import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { S3Module } from './infrastructure/s3/s3.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { ThrottlerBehindProxyGuard } from './guards/throttler-behind-proxy.guard';

import { TeamModule } from './domains/team/team.module';
import { AuthModule } from './domains/auth/auth.module';
import { UserModule } from './domains/user/user.module';
import { UserService } from './domains/user/user.service';
import { GalleryModule } from './domains/gallery/gallery.module';
import { ProjectModule } from './domains/project/project.module';

import { SeederModule } from './seeder/seeder.module';
import { SeederService } from './seeder/seeder.service';
import { createWinstonConfig } from './infrastructure/logging/winston.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().port().default(2000),
      }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 1 * 1000,
          limit: 5,
        },
      ],
      errorMessage: 'Too many requests, please try again later.',
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createWinstonConfig,
    }),
    PrismaModule,
    TeamModule,
    ProjectModule,
    GalleryModule,
    AuthModule,
    UserModule,
    S3Module,
    SeederModule,
  ],
  controllers: [],
  providers: [
    UserService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    SeederService,
  ],
})
export class AppModule {}
