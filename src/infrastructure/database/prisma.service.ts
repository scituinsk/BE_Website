import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaLogger } from '../logging/prisma.logger';
// import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private prismaLogger: PrismaLogger;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    // const adapter = new PrismaPg({
    //   connectionString: process.env.DATABASE_URL,
    // });

    super({
      // adapter,
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
        {
          emit: 'event',
          level: 'error',
        },
      ],
    });

    this.prismaLogger = new PrismaLogger(logger);

    this.$on('query' as never, (e: any) => {
      this.prismaLogger.log(
        'query',
        `Query: ${e.query} - Duration: ${e.duration}ms`,
      );
    });

    this.$on('info' as never, (e: any) => {
      this.prismaLogger.log('info', e.message);
    });

    this.$on('warn' as never, (e: any) => {
      this.prismaLogger.log('warn', e.message);
    });

    this.$on('error' as never, (e: any) => {
      this.prismaLogger.log('error', e.message);
    });
  }

  async onModuleInit() {
    this.logger.log('Initializing Prisma connection...', 'PrismaService');
    await this.$connect();
    this.logger.log('Prisma connection established', 'PrismaService');
  }

  async onModuleDestroy() {
    this.logger.log('Closing Prisma connection...', 'PrismaService');
    await this.$disconnect();
    this.logger.log('Prisma connection closed', 'PrismaService');
  }
}
