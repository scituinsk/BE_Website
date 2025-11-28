import { PrismaService } from 'src/infrastructure/database/prisma.service';

import data from './data/techstack.json';

export const seedTechnologiesData = async (prismaService: PrismaService) => {
  console.log('Seeding technologies data...');
  await prismaService.technology.createMany({
    data: data.map((tech) => ({
      name: tech.nama,
      logoUrl: tech.sumber,
    })),
    skipDuplicates: true,
  });
  console.log('Technologies data seeded successfully.');
};
