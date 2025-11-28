import { PrismaService } from 'src/infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';

const initialUser = {
  name: 'Administrator',
  username: 'admin',
  password: 'Admin@12345',
};

export const seedInitialUser = async (prismaService: PrismaService) => {
  console.log('Seeding initial user...');
  await prismaService.user.upsert({
    where: { username: initialUser.username },
    update: {},
    create: {
      name: initialUser.name,
      username: initialUser.username,
      password: await bcrypt.hash(initialUser.password, 10),
      role: 'ADMIN',
    },
  });
  console.log('Initial user seeded successfully.');
};
