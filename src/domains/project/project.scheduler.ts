import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProjectService } from './project.service';

@Injectable()
export class ProjectScheduler {
  private readonly logger = new Logger(ProjectScheduler.name);

  constructor(private readonly projectService: ProjectService) {}

  /**
   * Runs every day at 4 AM to cleanup orphan project images
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleCleanupOrphanProjectImages() {
    this.logger.log('Starting scheduled cleanup of orphan project images...');

    try {
      const result = await this.projectService.cleanupOrphanProjectImages();

      this.logger.log(
        `Cleanup completed successfully: ${result.deleted} images deleted, ${result.failed} failed out of ${result.total} total orphan images`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup orphan project images: ${error.message}`,
        error.stack,
      );
    }
  }
}
