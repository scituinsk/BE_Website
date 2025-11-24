import { Prisma } from '../../../generated/prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { tryCatchAsync } from 'src/common/utils/trycatch';
import { PrismaService } from 'src/infra/database/prisma.service';

import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectService {
  constructor(private prismaService: PrismaService) {}

  async findAll() {
    const projects = await this.prismaService.project.findMany({});

    return projects;
  }

  async create(createProjectDto: CreateProjectDto) {
    const { title, description, slug, linkDemo } = createProjectDto;

    const [project, error] = await tryCatchAsync(
      this.prismaService.project.create({
        data: {
          title,
          description,
          slug,
          demoUrl: linkDemo,
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
      this.prismaService.project.findUniqueOrThrow({ where: { id } }),
    );

    if (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Project not found');
        }
      }
      throw error;
    }

    return projectById;
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
}
