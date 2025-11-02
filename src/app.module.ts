import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infra/database/prisma.module';
import { TeamModule } from './domains/team/team.module';
import { ProjectModule } from './domains/project/project.module';
import { GalleryModule } from './domains/gallery/gallery.module';
import { AuthModule } from './domains/auth/auth.module';
import { UserService } from './domains/user/user.service';
import { UserModule } from './domains/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { createWinstonConfig } from './infra/logging/winston.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(createWinstonConfig()),
    PrismaModule,
    TeamModule,
    ProjectModule,
    GalleryModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, UserService],
})
export class AppModule {}
