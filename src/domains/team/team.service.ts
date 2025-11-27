import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from 'src/dto/pagination.dto';
import { ResponseBuilder } from 'src/utils/response-builder.util';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

@Injectable()
export class TeamService {
  constructor(private prismaService: PrismaService) {}

  async getDashboardSummaryData() {
    const [divisions, allMembersCount] = await Promise.all([
      // Query pertama: Ambil semua divisi, sertakan member, dan hitung member per divisi
      this.prismaService.division.findMany({
        include: {
          // Sertakan data member (hanya field yang perlu)
          members: {
            take: 10,
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          // Sertakan hitungan member untuk setiap divisi
          _count: {
            select: { members: true },
          },
        },
      }),
      // Query kedua: Hitung semua member di database
      this.prismaService.member.count(),
    ]);

    const response = {
      divisions: divisions,
      _count: {
        allMembers: allMembersCount,
        divisions: divisions.length,
      },
    };

    return ResponseBuilder.success(response);
  }

  async getDivisionBySlug(slug: string, paginationDto: PaginationDto) {
    // Ambil info divisi
    const division = await this.prismaService.division.findUnique({
      where: {
        slug: slug,
      },
    });

    if (!division) {
      throw new NotFoundException('Divisi tidak ditemukan');
    }

    const { page = 1, per_page = 10 } = paginationDto;
    const skip = (page - 1) * per_page;
    const take = per_page;

    const [members, totalItems] = await Promise.all([
      this.prismaService.member.findMany({
        where: {
          divisionId: division.id,
        },
        skip: skip,
        take: take,
        orderBy: {
          name: 'asc',
        },
      }),

      this.prismaService.member.count({
        where: {
          divisionId: division.id,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / per_page);

    const response = {
      divisionInfo: division,
      members,
    };

    const paginationMetadata = {
      page: +page,
      perPage: +per_page,
      total: totalItems,
      totalPages: totalPages,
    };

    return ResponseBuilder.successWithPagination(response, paginationMetadata);
  }

  addMember(divisionId: string) {
    console.log(divisionId);
  }

  removeMember(memberId: string) {
    console.log(memberId);
  }
}
