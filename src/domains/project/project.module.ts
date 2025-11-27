import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectScheduler } from './project.scheduler';
import { S3Module } from 'src/infrastructure/s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectScheduler],
})
export class ProjectModule {}
