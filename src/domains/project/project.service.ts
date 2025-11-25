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
import { ChangeSlugDto } from './dtos/change-slug-dto';
import { UpdateBasicInfoDto } from './dtos/update-basic-info.dto';

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

  async changeSlug(projectId: number, ChangeSlugDto: ChangeSlugDto) {
    const { slug } = ChangeSlugDto;
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
}
