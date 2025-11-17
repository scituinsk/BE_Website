import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infra/database/prisma.module';
import { TeamModule } from './domains/team/team.module';
import { ProjectModule } from './domains/project/project.module';
import { GalleryModule } from './domains/gallery/gallery.module';
import { AuthModule } from './domains/auth/auth.module';
import { UserService } from './domains/user/user.service';
import { UserModule } from './domains/user/user.module';
import { createWinstonConfig } from './infra/logging/winston.config';
import { CommonModule } from './domains/common/common.module';
import { S3Module } from './infra/s3/s3.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from './guards/throttler-behind-proxy.guard';
import { SeederService } from './seeder/seeder.service';
import { SeederModule } from './seeder/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    WinstonModule.forRoot(createWinstonConfig()),
    PrismaModule,
    TeamModule,
    ProjectModule,
    GalleryModule,
    AuthModule,
    UserModule,
    CommonModule,
    S3Module,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UserService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    SeederService,
  ],
})
export class AppModule {}
