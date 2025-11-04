import { Injectable } from '@nestjs/common';
import { ResponseUtil } from 'src/common/utils/response.util';
import { PrismaService } from 'src/infra/database/prisma.service';

@Injectable()
export class CommonService {
  constructor(private prismaService: PrismaService) {}

  async getAllDivisions() {
    const divisions = await this.prismaService.division.findMany();
    return ResponseUtil.success(divisions);
  }

  async getAllPositions() {
    const positions = await this.prismaService.position.findMany();
    return ResponseUtil.success(positions);
  }
}
