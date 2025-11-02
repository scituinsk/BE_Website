import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: [
        {
          emit: 'stdout',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
        {
          emit: 'stdout',
          level: 'error',
        },
      ],
    });
  }

  async onModuleInit() {
    console.log('init prisma..');
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
