import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { SeederService } from './seeder/seeder.service';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Seeder');

  if (process.env.NODE_ENV === 'production') {
    logger.warn(
      'Seeding tidak diizinkan di lingkungan produksi. Proses dihentikan.',
    );
    return;
  }

  const seeder = appContext.get(SeederService);

  logger.log('Memulai seeding dari skrip...');

  try {
    await seeder.seed();
    logger.log('Seeding berhasil diselesaikan.');
  } catch (error) {
    logger.error('Seeding gagal!', error.stack);
  } finally {
    await appContext.close();
  }
}

bootstrap();
