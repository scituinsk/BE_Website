import { PrismaService } from 'src/infrastructure/database/prisma.service';

export const seedDivisionFeature = async (prismaService: PrismaService) => {
  console.log('Seeding divisions...');
  await prismaService.division.createMany({
    data: [
      {
        name: 'RPL & SI',
        slug: 'rpl-si',
        description: 'Rekayasa Perangkat Lunak & Sistem Informasi',
      },
      {
        name: 'Jaringan & Cyber Security',
        slug: 'jaringan-komputer-cyber-security',
        description: 'Jaringan Komputer & Cyber Security',
      },
      {
        name: 'ML & AI',
        slug: 'ml-ai',
        description: 'Machine Learning & Artificial Intelligence',
      },
    ],
    skipDuplicates: true,
  });
  console.log('Divisions seeded successfully.');
  const divisions = await prismaService.division.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  const getDivisionId = (slug: string): number => {
    const division = divisions.find((d) => d.slug === slug);
    if (!division) {
      throw new Error(`Division with slug "${slug}" not found.`);
    }
    return division.id;
  };
  const membersData = [
    // Members untuk RPL & SI
    {
      name: 'Ahmad Budiman',
      imageUrl: 'https://placehold.co/400',
      divisionId: getDivisionId('rpl-si'),
    },
    {
      name: 'Siti Aminah',
      imageUrl: 'https://placehold.co/400',
      divisionId: getDivisionId('rpl-si'),
    },
    {
      name: 'Budi Santoso',
      imageUrl: 'https://placehold.co/400',
      divisionId: getDivisionId('rpl-si'),
    },
    // Members untuk Jaringan & Cyber Security
    {
      name: 'Charlie Darmawan',
      imageUrl: 'https://placehold.co/400',
      divisionId: getDivisionId('jaringan-komputer-cyber-security'),
    },
    {
      name: 'Dewi Lestari',
      imageUrl: 'https://placehold.co/400',
      divisionId: getDivisionId('jaringan-komputer-cyber-security'),
    },
    // Members untuk ML & AI
    {
      name: 'Eka Wijaya',
      imageUrl: 'https://placehold.co/400',
      divisionId: getDivisionId('ml-ai'),
    },
    {
      name: 'Fajar Nugroho',
      imageUrl: 'https://placehold.co/400',
      divisionId: getDivisionId('ml-ai'),
    },
  ];
  console.log('Seeding members...');
  await prismaService.member.createMany({
    data: membersData,
    skipDuplicates: true,
  });
  console.log('Members seeded successfully.');
};
