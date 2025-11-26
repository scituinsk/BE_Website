import { Prisma } from '../../../generated/prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { tryCatchAsync } from 'src/common/utils/trycatch';
import { PrismaService } from 'src/infra/database/prisma.service';
import { ResponseBuilder } from 'src/common/utils/response.util';

import { CreateProjectDto } from './dtos/create-project.dto';
import { QueryProjectsDto } from './dtos/query-projects.dto';
import { UpdateSlugDto } from './dtos/update-slug-dto';
import { UpdateBasicInfoDto } from './dtos/update-basic-info.dto';
import { SyncTechnologiesDto } from './dtos/sync-technologies.dto';
import { SyncProjectDetailsDto } from './dtos/sync-project-detail.dto';

@Injectable()
export class ProjectService {
  constructor(private prismaService: PrismaService) {}

  async findAll(query: QueryProjectsDto) {
    const { page = 1, per_page = 10, search } = query;
    const skip = (page - 1) * per_page;

    // Build where clause for searching
    const where: Prisma.ProjectWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Get total count for pagination
    const total = await this.prismaService.project.count({ where });

    // Get projects with pagination
    const projects = await this.prismaService.project.findMany({
      where,
      skip,
      take: per_page,
      include: {
        technologies: {
          select: {
            technology: true,
          },
        },
        images: {
          where: {
            isPrimary: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatedProjects = projects.map((project) => ({
      ...project,
      technologies: project.technologies.map((t) => t.technology),
    }));

    const pagination = ResponseBuilder.buildPaginationMeta(
      page,
      per_page,
      total,
    );

    return { data: formatedProjects, pagination };
  }

  async create(createProjectDto: CreateProjectDto) {
    const { title, description, slug, linkDemo, launchYear, duration } =
      createProjectDto;

    const [project, error] = await tryCatchAsync(
      this.prismaService.project.create({
        data: {
          title,
          description,
          slug,
          demoUrl: linkDemo,
          launchYear,
          duration,
        },
      }),
    );

    if (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Project with this slug already exists',
          );
        }
      }
      throw error;
    }

    return project;
  }

  async findById(id: number) {
    const [projectById, error] = await tryCatchAsync(
      this.prismaService.project.findUniqueOrThrow({
        where: { id },
        include: {
          images: true,
          technologies: {
            select: {
              technology: true,
            },
          },
          challenges: true,
          keyFeatures: true,
          results: true,
          testimonials: true,
        },
      }),
    );

    if (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Project not found');
        }
      }
      throw error;
    }

    const formatedProjectById = {
      ...projectById,
      technologies: projectById.technologies.map((t) => t.technology),
    };

    return formatedProjectById;
  }

  async changeSlug(projectId: number, updateSlugDto: UpdateSlugDto) {
    const { slug } = updateSlugDto;
    const [project, error] = await tryCatchAsync(
      this.prismaService.project.update({
        where: {
          id: projectId,
        },
        data: {
          slug,
        },
      }),
    );

    if (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Project not found');
        } else if (error.code === 'P2002') {
          throw new BadRequestException(
            'Project with this slug already exists',
          );
        }
      }
      throw error;
    }

    return project;
  }

  async delete(projectId: number) {
    const [deletedProject, error] = await tryCatchAsync(
      this.prismaService.project.delete({
        where: { id: projectId },
      }),
    );

    if (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Project not found');
        }
      }
      throw error;
    }

    return deletedProject;
  }

  async updateBasicInfo(
    projectId: number,
    updateBasicInfoDto: UpdateBasicInfoDto,
  ) {
    const { title, demoUrl, description, duration, launchYear, status } =
      updateBasicInfoDto;

    const [project, error] = await tryCatchAsync(
      this.prismaService.project.update({
        where: {
          id: projectId,
        },
        data: {
          title,
          description,
          duration,
          launchYear,
          status,
          demoUrl,
        },
      }),
    );

    if (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Project not found');
        }
      }
      throw error;
    }

    return project;
  }

  async findAllTechstack(search: string) {
    // Build where clause for searching
    const where: Prisma.TechnologyWhereInput = search
      ? {
          OR: [{ name: { contains: search, mode: 'insensitive' } }],
        }
      : {};

    // Get projects with pagination
    const technologies = await this.prismaService.technology.findMany({
      where,
    });

    return { data: technologies };
  }

  async syncTechnologies(
    projectId: number,
    syncTechnologiesDto: SyncTechnologiesDto,
  ) {
    const { technologies } = syncTechnologiesDto;
    const technologyIds = technologies.map((tech) => tech.id);

    // Gunakan transaction untuk memastikan atomicity
    const [result, error] = await tryCatchAsync(
      this.prismaService.$transaction(async (tx) => {
        // Validasi project ada
        await tx.project.findUniqueOrThrow({
          where: { id: projectId },
        });

        // Validasi semua technology IDs ada di database
        const existingTechnologies = await tx.technology.findMany({
          where: {
            id: {
              in: technologyIds,
            },
          },
          select: {
            id: true,
          },
        });

        const existingTechnologyIds = existingTechnologies.map(
          (tech) => tech.id,
        );

        // Cek apakah ada technology ID yang tidak ada di database
        const invalidTechnologyIds = technologyIds.filter(
          (id) => !existingTechnologyIds.includes(id),
        );

        if (invalidTechnologyIds.length > 0) {
          throw new BadRequestException(
            `Technology with ID(s) ${invalidTechnologyIds.join(', ')} not found in database`,
          );
        }

        // Sinkronisasi: hapus semua technology lama dan tambahkan yang baru
        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: {
            technologies: {
              deleteMany: {},
              create: technologyIds.map((techId) => ({
                technologyId: techId,
              })),
            },
          },
          include: {
            technologies: {
              select: {
                technology: true,
              },
            },
          },
        });

        return updatedProject;
      }),
    );

    if (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Project not found');
        }
      }
      throw error;
    }

    // Format response untuk mengembalikan technologies
    const formatedProject = {
      ...result,
      technologies: result.technologies.map((t) => t.technology),
    };

    return formatedProject;
  }

  async syncProjectDetail(
    projectId: number,
    syncProjectDetailsDto: SyncProjectDetailsDto,
  ) {
    const { aboutProject, features, challenges, results } =
      syncProjectDetailsDto;

    // Gunakan transaction untuk memastikan atomicity
    const [result, error] = await tryCatchAsync(
      this.prismaService.$transaction(async (tx) => {
        // Validasi project ada
        await tx.project.findUniqueOrThrow({
          where: { id: projectId },
        });

        // Update project details dengan sinkronisasi semua relasi sekaligus
        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: {
            about: aboutProject,
            // Sync key features: hapus semua lalu buat baru
            keyFeatures: {
              deleteMany: {},
              create: features.map((feature) => ({
                feature: feature.feature,
              })),
            },
            // Sync challenges: hapus semua lalu buat baru
            challenges: {
              deleteMany: {},
              create: challenges.map((challenge) => ({
                challenge: challenge.challenge,
              })),
            },
            // Sync results: hapus semua lalu buat baru
            results: {
              deleteMany: {},
              create: results.map((result) => ({
                result: result.result,
              })),
            },
          },
          include: {
            keyFeatures: true,
            challenges: true,
            results: true,
          },
        });

        return updatedProject;
      }),
    );

    if (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Project not found');
        }
      }
      throw error;
    }

    return result;
  }
}
