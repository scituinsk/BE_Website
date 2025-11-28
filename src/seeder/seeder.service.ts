import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

import { seedInitialUser } from './seed-initial-user';
import { seedDivisionFeature } from './seed-divisions';
import { seedTechnologiesData } from './seed-technologies-data';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(@Inject(PrismaService) private prismaService: PrismaService) {}

  async seed() {
    await seedInitialUser(this.prismaService);
    await seedDivisionFeature(this.prismaService);
    await seedTechnologiesData(this.prismaService);
    this.logger.log('All seeding complete.');
  }
}
