import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ResponseBuilder } from 'src/common/utils/response.util';
import { PrismaService } from 'src/infra/database/prisma.service';

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

    const { page = 1, perPage = 10 } = paginationDto;
    const skip = (page - 1) * perPage;
    const take = perPage;

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

    const totalPages = Math.ceil(totalItems / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response = {
      divisionInfo: division,
      members,
    };

    const paginationMetadata = {
      page: +page,
      perPage: +perPage,
      totalItems: totalItems,
      totalPages: totalPages,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
      nextPage: hasNextPage ? +page + 1 : null,
      prevPage: hasPrevPage ? +page - 1 : null,
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
