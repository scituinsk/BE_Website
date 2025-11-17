import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserService } from './user.service';

@Injectable()
export class UserScheduler {
  private readonly logger = new Logger(UserScheduler.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Runs every day at 3 AM to cleanup deleted avatars
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanupDeletedAvatars() {
    this.logger.log('Starting scheduled cleanup of deleted avatars...');

    try {
      const result = await this.userService.cleanupDeletedAvatars();

      this.logger.log(
        `Cleanup completed successfully: ${result.deleted} avatars deleted, ${result.failed} failed out of ${result.total} total deleted avatars`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup deleted avatars: ${error.message}`,
        error.stack,
      );
    }
  }
}
