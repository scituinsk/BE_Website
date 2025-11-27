import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { ProjectService } from './project.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateTestimonialDto } from './dtos/update-testimonial.dto';
import { QueryProjectsDto } from './dtos/query-projects.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseBuilder } from 'src/utils/response-builder.util';
import { UpdateSlugDto } from './dtos/update-slug-dto';
import { UpdateBasicInfoDto } from './dtos/update-basic-info.dto';
import { SyncTechnologiesDto } from './dtos/sync-technologies.dto';
import { SyncProjectDetailsDto } from './dtos/sync-project-detail.dto';
import { CreateTestimonialDto } from './dtos/create-testimonial.dto';
import { UploadProjectImageDto } from './dtos/upload-project-image.dto';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('/')
  async findAll(@Query() query: QueryProjectsDto) {
    const { data, pagination } = await this.projectService.findAll(query);
    return ResponseBuilder.successWithPagination(data, pagination);
  }

  @Get(':projectId')
  async findOne(@Param('projectId', ParseIntPipe) projectId: number) {
    const project = await this.projectService.findById(projectId);
    return ResponseBuilder.success(project);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProjectDto: CreateProjectDto) {
    const project = await this.projectService.create(createProjectDto);

    return ResponseBuilder.success(project, 'Project created successfully');
  }

  @Patch('/change-slug/:projectId')
  @UseGuards(JwtAuthGuard)
  async updateSlug(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() updateSulugDto: UpdateSlugDto,
  ) {
    const result = await this.projectService.changeSlug(
      projectId,
      updateSulugDto,
    );

    return ResponseBuilder.success(result, 'Slug updated successfully');
  }

  @Delete(':projectId')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('projectId', ParseIntPipe) id: number) {
    const deletedProject = await this.projectService.delete(id);
    return ResponseBuilder.success(
      deletedProject,
      'Project deleted successfully',
    );
  }

  @Patch(':projectId/basic-info')
  @UseGuards(JwtAuthGuard)
  async updateBasicInfo(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() updateBasicInfoDto: UpdateBasicInfoDto,
  ) {
    const result = await this.projectService.updateBasicInfo(
      projectId,
      updateBasicInfoDto,
    );

    return ResponseBuilder.success(result, 'Basic info updated successfully');
  }

  @Get('/tech-stacks/lists')
  async getAllTechStackList(@Query('search') query: string) {
    const { data } = await this.projectService.findAllTechstack(query);
    return ResponseBuilder.success(data);
  }

  @Post(':projectId/technologies')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateTechStack(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() syncTechnologiesDto: SyncTechnologiesDto,
  ) {
    const result = await this.projectService.syncTechnologies(
      projectId,
      syncTechnologiesDto,
    );
    return ResponseBuilder.success(
      result,
      'Technologies synchronized successfully',
    );
  }

  @Post(':projectId/details')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async syncProjectDetail(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() syncProjectDetailsDto: SyncProjectDetailsDto,
  ) {
    const result = await this.projectService.syncProjectDetail(
      projectId,
      syncProjectDetailsDto,
    );

    return ResponseBuilder.success(
      result,
      'Project details synchronized successfully',
    );
  }

  @Post(':projectId/testimonials')
  @UseGuards(JwtAuthGuard)
  async createTestimonials(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createTestimonialDto: CreateTestimonialDto,
  ) {
    const result = await this.projectService.createTestimonial(
      projectId,
      createTestimonialDto,
    );

    return ResponseBuilder.success(result, 'Testimonial created successfully');
  }

  @Patch(':projectId/testimonials/:testimonialId')
  @UseGuards(JwtAuthGuard)
  async editTestimonials(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('testimonialId', ParseIntPipe) testimonialId: number,
    @Body() updateTestimonialDto: UpdateTestimonialDto,
  ) {
    const result = await this.projectService.editTestimonial(
      projectId,
      testimonialId,
      updateTestimonialDto,
    );
    return ResponseBuilder.success(result, 'Testimonial updated successfully');
  }

  @Delete(':projectId/testimonials/:testimonialId')
  @UseGuards(JwtAuthGuard)
  async deleteTestimonial(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('testimonialId', ParseIntPipe) testimonialId: number,
  ) {
    const result = await this.projectService.deleteTestimonial(
      projectId,
      testimonialId,
    );
    return ResponseBuilder.success(result, 'Testimonial deleted successfully');
  }

  @Post(':projectId/images/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async uploadProjectImage(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() uploadProjectImageDto: UploadProjectImageDto,
  ) {
    const result = await this.projectService.uploadProjectImage(
      projectId,
      uploadProjectImageDto,
    );
    return ResponseBuilder.success(
      result,
      'Presigned URL generated successfully',
    );
  }

  @Post(':projectId/images/:imageId/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async confirmProjectImageUpload(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    const result = await this.projectService.confirmProjectImageUpload(
      projectId,
      imageId,
    );
    return ResponseBuilder.success(result, 'Upload confirmed successfully');
  }

  @Patch(':projectId/images/:imageId')
  @UseGuards(JwtAuthGuard)
  async setPrimaryImage(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    const result = await this.projectService.setPrimaryImage(
      projectId,
      imageId,
    );

    return ResponseBuilder.success(result, 'Primary image set successfully');
  }

  @Delete(':projectId/images/:imageId')
  @UseGuards(JwtAuthGuard)
  async deleteImage(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    const result = await this.projectService.deleteProjectImage(
      projectId,
      imageId,
    );

    return ResponseBuilder.success(result, 'Image deleted successfully');
  }
}
