import { Controller, Get } from '@nestjs/common';

@Controller('teams')
export class TeamController {
  constructor() {}
  @Get()
  async getTeams() {
    return [];
  }
}
