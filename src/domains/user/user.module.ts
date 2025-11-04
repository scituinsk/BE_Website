import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../../infra/database/prisma.module';
import { S3Module } from '../../infra/s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
