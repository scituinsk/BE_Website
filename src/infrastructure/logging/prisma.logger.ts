import { LoggerService } from '@nestjs/common';

export class PrismaLogger {
  constructor(private readonly logger: LoggerService) {}

  log(level: 'info' | 'query' | 'warn' | 'error', message: string) {
    switch (level) {
      case 'info':
        this.logger.log(message, 'Prisma');
        break;
      case 'query':
        // Log query hanya di development untuk performance analysis
        if (process.env.NODE_ENV !== 'production') {
          if (this.logger.debug) {
            this.logger.debug(message, 'PrismaQuery');
          }
        }
        break;
      case 'warn':
        this.logger.warn(message, 'Prisma');
        break;
      case 'error':
        this.logger.error(message, 'Prisma');
        break;
    }
  }
}
