import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './infra/database/prisma.service';

@Controller()
export class AppController {
  constructor(
    private appService: AppService,
    private prismaService: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    this.prismaService.post.findMany().then((posts) => {
      console.log('Posts from database:', posts);
    });
    return this.appService.getHello();
  }
}
