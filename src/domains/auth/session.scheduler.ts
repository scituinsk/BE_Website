import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from './session.service';

/**
 * Session Scheduler for cleaning up expired sessions
 *
 * To enable automatic cleanup, install @nestjs/schedule:
 * npm install @nestjs/schedule
 *
 * Then uncomment the @Cron decorator and import
 * Also add ScheduleModule.forRoot() to AppModule imports
 */
@Injectable()
export class SessionScheduler {
  private readonly logger = new Logger(SessionScheduler.name);

  constructor(private sessionService: SessionService) {}

  // Uncomment when @nestjs/schedule is installed
  // @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpiredSessionCleanup() {
    this.logger.log('Starting expired sessions cleanup...');
    try {
      const result = await this.sessionService.cleanupExpiredSessions();
      this.logger.log(
        `Successfully cleaned up ${result.count} expired sessions`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error);
    }
  }
}
