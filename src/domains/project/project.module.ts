import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { S3Module } from 'src/infra/s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
