import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserScheduler } from './user.scheduler';
import { PrismaModule } from '../../infra/database/prisma.module';
import { S3Module } from '../../infra/s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [UserController],
  providers: [UserService, UserScheduler],
  exports: [UserService],
})
export class UserModule {}
