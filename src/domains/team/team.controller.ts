import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FindOneDivisionParams } from './dto/find-one-division-params.dto';
import { TeamService } from './team.service';
import { PaginationDto } from 'src/dto/pagination.dto';

@Controller('teams')
export class TeamController {
  constructor(private teamService: TeamService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/management-dashboard')
  async getDataDashboardManagementTeam() {
    return this.teamService.getDashboardSummaryData();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/core-team')
  async getDataDashboardManagementCoreTeam() {
    return {
      statusCode: 200,
      message: 'Core teams data fetched successfully',
      data: [
        {
          scope: 'SCIT',
          positions: {
            lead: {
              id: 1,
              name: 'Ahmad Budiman',
              role: 'Lead',
              generation: "23'",
              imageUrl: 'https://placehold.co/400',
            },
            secretary: {
              id: 2,
              name: 'Siti Aminah',
              role: 'Secretary',
              generation: "23'",
              imageUrl: 'https://placehold.co/400',
            },
            publicRelations: [
              {
                id: 3,
                name: 'Lina Kusuma',
                Role: 'Public Relations',
                generation: "24'",
                imageUrl: 'https://placehold.co/400',
              },
              {
                id: 4,
                name: 'Dian Pratiwi',
                role: 'Public Relations',
                generation: "24'",
                imageUrl: 'https://placehold.co/400',
              },
            ],
          },
        },
        {
          scope: 'RPL & SI',
          positions: {
            lead: {
              id: 5,
              name: 'Budi Santoso',
              role: 'Lead RPL & SI',
              generation: "24'",
              imageUrl: 'https://placehold.co/400',
            },
            'co-lead': {
              id: 6,
              name: 'Rina Marlina',
              role: 'Co-Lead RPL & SI',
              generation: "24'",
              imageUrl: 'https://placehold.co/400',
            },
            secretary: {
              id: 7,
              name: 'Dewi Lestari',
              role: 'Secretary RPL & SI',
              generation: "24'",
              imageUrl: 'https://placehold.co/400',
            },
            mediaAndInformation: [
              {
                id: 8,
                name: 'Agus Wijaya',
                role: 'Media & Information RPL & SI',
                generation: "25'",
                imageUrl: 'https://placehold.co/400',
              },
              {
                id: 9,
                name: 'Sari Melati',
                role: 'Media & Information RPL & SI',
                generation: "25'",
                imageUrl: 'https://placehold.co/400',
              },
            ],
          },
        },
        {
          scope: 'Jaringan & Cyber Security',
          positions: {
            lead: {
              id: 10,
              name: 'Fahri Pratama',
              role: 'Lead Networking',
              generation: "24'",
              imageUrl: 'https://placehold.co/400',
            },
            'co-lead': {
              id: 11,
              name: 'Rania Putri',
              role: 'Co-Lead Networking',
              generation: "24'",
              imageUrl: 'https://placehold.co/400',
            },
            secretary: {
              id: 12,
              name: 'Wulan Fitri',
              role: 'Secretary Networking',
              generation: "24'",
              imageUrl: 'https://placehold.co/400',
            },
            mediaAndInformation: [
              {
                id: 13,
                name: 'Yoga Saputra',
                role: 'Media & Information Networking',
                generation: "25'",
                imageUrl: 'https://placehold.co/400',
              },
              {
                id: 14,
                name: 'Dea Permata',
                role: 'Media & Information Networking',
                generation: "25'",
                imageUrl: 'https://placehold.co/400',
              },
            ],
          },
        },
        {
          scope: 'ML & AI',
          positions: {
            lead: {
              id: 15,
              name: 'Ridho Kurniawan',
              role: 'Lead ML & AI',
              generation: "24'",
              imageUrl: 'https://placehold.co/400',
            },
            'co-lead': {
              id: 16,
              name: 'Zahra Aulia',
              role: 'Co-Lead ML & AI',
              generation: "24'",
              imageUrl: 'https://placehold.co/400',
            },
            secretary: {
              id: 17,
              name: 'Maya Puspita',
              role: 'Secretary ML & AI',
              generation: "24'",
              imageUrl: 'https://placehold.co/400',
            },
            mediaAndInformation: [
              {
                id: 18,
                name: 'Raka Firdaus',
                role: 'Media & Information ML & AI',
                generation: "25'",
                imageUrl: 'https://placehold.co/400',
              },
              {
                id: 19,
                name: 'Selvi Anggraeni',
                role: 'Media & Information ML & AI',
                generation: "25'",
                imageUrl: 'https://placehold.co/400',
              },
            ],
          },
        },
      ],
    };
  }

  @Get('/divisions/:divisionSlug')
  async getDivisionById(
    @Param() params: FindOneDivisionParams,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.teamService.getDivisionBySlug(
      params.divisionSlug,
      paginationDto,
    );
  }
}
