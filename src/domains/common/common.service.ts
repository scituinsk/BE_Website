import { Injectable } from '@nestjs/common';
// import { ResponseUtil } from 'src/common/utils/response.util';

@Injectable()
export class CommonService {
  constructor() {}

  // async getAllDivisions() {
  //   const divisions = await this.prismaService.division.findMany();
  //   return ResponseUtil.success(divisions);
  // }

  // async getAllPositions() {
  //   const positions = await this.prismaService.position.findMany();
  //   return ResponseUtil.success(positions);
  // }
}
