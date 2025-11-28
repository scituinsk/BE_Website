import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { PrismaModule } from 'src/infrastructure/database/prisma.module';
import { createWinstonConfig } from 'src/infrastructure/logging/winston.config';
import { SeederService } from './seeder.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createWinstonConfig,
    }),
    PrismaModule,
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
