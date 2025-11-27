import { Prisma } from '../../../generated/prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { ResponseBuilder } from 'src/utils/response-builder.util';
import { S3Service } from 'src/infrastructure/s3/s3.service';

import { CreateProjectDto } from './dtos/create-project.dto';
import { QueryProjectsDto } from './dtos/query-projects.dto';
import { UpdateSlugDto } from './dtos/update-slug-dto';
import { UpdateBasicInfoDto } from './dtos/update-basic-info.dto';
import { SyncTechnologiesDto } from './dtos/sync-technologies.dto';
import { SyncProjectDetailsDto } from './dtos/sync-project-detail.dto';
import { CreateTestimonialDto } from './dtos/create-testimonial.dto';
import { UpdateTestimonialDto } from './dtos/update-testimonial.dto';
import { UploadProjectImageDto } from './dtos/upload-project-image.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ProjectService {
  constructor(
    private prismaService: PrismaService,
    private s3Service: S3Service,
  ) {}

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

    const project = await this.prismaService.project.create({
      data: {
        title,
        description,
        slug,
        demoUrl: linkDemo,
        launchYear,
        duration,
      },
    });

    return project;
  }

  async findById(id: number) {
    const projectById = await this.prismaService.project.findUniqueOrThrow({
      where: { id },
      include: {
        images: {
          where: {
            isUsed: true,
          },
        },
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
    });

    const formatedProjectById = {
      ...projectById,
      technologies: projectById.technologies.map((t) => t.technology),
    };

    return formatedProjectById;
  }

  async changeSlug(projectId: number, updateSlugDto: UpdateSlugDto) {
    const { slug } = updateSlugDto;
    const project = await this.prismaService.project.update({
      where: {
        id: projectId,
      },
      data: {
        slug,
      },
    });

    return project;
  }

  async delete(projectId: number) {
    const deletedProject = await this.prismaService.project.delete({
      where: { id: projectId },
    });

    return deletedProject;
  }

  async updateBasicInfo(
    projectId: number,
    updateBasicInfoDto: UpdateBasicInfoDto,
  ) {
    const { title, demoUrl, description, duration, launchYear, status } =
      updateBasicInfoDto;

    const project = await this.prismaService.project.update({
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
    });

    return project;
  }

  async findAllTechstack(search: string) {
    const where: Prisma.TechnologyWhereInput = search
      ? {
          OR: [{ name: { contains: search, mode: 'insensitive' } }],
        }
      : {};

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
    const result = await this.prismaService.$transaction(async (tx) => {
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

      const existingTechnologyIds = existingTechnologies.map((tech) => tech.id);

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
    });

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

    const result = await this.prismaService.$transaction(async (tx) => {
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
    });

    return result;
  }

  async createTestimonial(
    projectId: number,
    createTestimonialDto: CreateTestimonialDto,
  ) {
    const { name, avatarUrl, rating, role, testimonial } = createTestimonialDto;

    const existingProject = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project tidak ditemukan');
    }

    return this.prismaService.projectTestimonial.create({
      data: {
        project: {
          connect: {
            id: projectId,
          },
        },
        name,
        rating,
        role,
        testimonial,
        avatarUrl,
      },
    });
  }

  async editTestimonial(
    projectId: number,
    testimonialId: number,
    updateTestimonialDto: UpdateTestimonialDto,
  ) {
    const existingTestimonial =
      await this.prismaService.projectTestimonial.findFirst({
        where: {
          id: testimonialId,
          projectId: projectId,
        },
      });

    if (!existingTestimonial) {
      throw new NotFoundException('Testimonial not found for this project');
    }
    const { name, avatarUrl, rating, role, testimonial } = updateTestimonialDto;

    return this.prismaService.projectTestimonial.update({
      where: { id: testimonialId },
      data: {
        name,
        avatarUrl,
        rating,
        role,
        testimonial,
      },
    });
  }
  async deleteTestimonial(projectId: number, testimonialId: number) {
    const existingTestimonial =
      await this.prismaService.projectTestimonial.findFirst({
        where: {
          id: testimonialId,
          projectId: projectId,
        },
      });
    if (!existingTestimonial) {
      throw new NotFoundException('Testimonial not found for this project');
    }
    return this.prismaService.projectTestimonial.delete({
      where: { id: testimonialId },
    });
  }

  async uploadProjectImage(
    projectId: number,
    uploadProjectImageDto: UploadProjectImageDto,
  ) {
    const { fileType, fileSize } = uploadProjectImageDto;

    const fileName = randomUUID();

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(fileType)) {
      throw new BadRequestException(
        'Jenis file tidak didukung. Hanya JPEG, PNG, GIF, dan WEBP yang diizinkan.',
      );
    }

    // Validasi project exists
    const existingProject = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project tidak ditemukan');
    }

    // Generate presigned URL untuk upload
    const { uploadUrl, fileUrl, key } =
      await this.s3Service.generatePresignedUploadUrl(
        fileName,
        fileType,
        'projects',
        3600, // 1 hour expirationnya
      );

    // Create project image record dengan status pending
    const projectImage = await this.prismaService.projectImage.create({
      data: {
        project: {
          connect: {
            id: projectId,
          },
        },
        fileName,
        fileType,
        fileSize,
        imageUrl: fileUrl,
        key: key,
        isUsed: false, // akan di-set true saat konfirmasi upload
      },
    });

    return {
      id: projectImage.id,
      uploadUrl,
      fileUrl,
      key,
    };
  }

  async confirmProjectImageUpload(projectId: number, imageId: number) {
    // Validasi project exists
    const existingProject = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project tidak ditemukan');
    }

    // Validasi image exists dan belongs to this project
    const projectImage = await this.prismaService.projectImage.findFirst({
      where: {
        id: imageId,
        projectId: projectId,
      },
    });

    if (!projectImage) {
      throw new NotFoundException(
        'Project image tidak ditemukan atau tidak terkait dengan project ini',
      );
    }

    await this.prismaService.projectImage.update({
      where: {
        id: imageId,
      },
      data: {
        isUsed: true,
      },
    });

    return {
      id: projectImage.id,
      fileName: projectImage.fileName,
      imageUrl: projectImage.imageUrl,
      isPrimary: projectImage.isPrimary,
    };
  }

  /**
   * Cleanup orphan project images (called by cronjob)
   * Deletes ProjectImage records where isUsed = false
   * Also attempts to delete files from S3
   */
  async cleanupOrphanProjectImages(): Promise<{
    total: number;
    deleted: number;
    failed: number;
  }> {
    // Find all unused project images
    const orphanImages = await this.prismaService.projectImage.findMany({
      where: {
        isUsed: false,
      },
      select: {
        id: true,
        key: true,
      },
    });

    const total = orphanImages.length;
    let deleted = 0;
    let failed = 0;

    for (const image of orphanImages) {
      try {
        // Delete from S3 if exists
        const fileExists = await this.s3Service.fileExists(image.key);
        if (fileExists) {
          await this.s3Service.deleteFileByKey(image.key);
        }

        // Delete from database
        await this.prismaService.projectImage.delete({
          where: { id: image.id },
        });

        deleted++;
      } catch (error) {
        failed++;
        // Log error but continue with other images
        console.error(
          `Failed to delete orphan project image ${image.id}: ${error.message}`,
        );
      }
    }

    return { total, deleted, failed };
  }

  async setPrimaryImage(projectId: number, imageId: number) {
    // Gunakan transaction untuk memastikan atomicity
    const result = await this.prismaService.$transaction(async (tx) => {
      // Validasi project exists
      await tx.project.findUniqueOrThrow({
        where: { id: projectId },
      });

      // Validasi image exists dan belongs to this project
      const image = await tx.projectImage.findFirst({
        where: {
          id: imageId,
          projectId: projectId,
        },
      });

      if (!image) {
        throw new NotFoundException(
          'Project image tidak ditemukan atau tidak terkait dengan project ini',
        );
      }

      // Set semua images dalam project ini menjadi isPrimary = false
      await tx.projectImage.updateMany({
        where: {
          projectId: projectId,
        },
        data: {
          isPrimary: false,
        },
      });

      // Set image yang dipilih menjadi isPrimary = true
      const updatedImage = await tx.projectImage.update({
        where: { id: imageId },
        data: {
          isPrimary: true,
        },
      });

      return updatedImage;
    });

    return result;
  }

  async deleteProjectImage(projectId: number, imageId: number) {
    const result = await this.prismaService.$transaction(async (tx) => {
      // Validasi project exists
      await tx.project.findUniqueOrThrow({
        where: { id: projectId },
      });

      // Validasi image exists dan belongs to this project
      const image = await tx.projectImage.findFirst({
        where: {
          id: imageId,
          projectId: projectId,
        },
      });

      if (!image) {
        throw new NotFoundException(
          'Project image tidak ditemukan atau tidak terkait dengan project ini',
        );
      }

      // Mark deleted image in db
      const deletedImage = await tx.projectImage.update({
        where: { id: imageId },
        data: {
          isUsed: false,
        },
      });

      return deletedImage;
    });

    return result;
  }
}
