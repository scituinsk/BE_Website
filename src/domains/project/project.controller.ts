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
  NotImplementedException,
} from '@nestjs/common';

import { ProjectService } from './project.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { QueryProjectsDto } from './dtos/query-projects.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseBuilder } from 'src/common/utils/response.util';
import { ChangeSlugDto } from './dtos/change-slug-dto';
import { UpdateBasicInfoDto } from './dtos/update-basic-info.dto';

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
    @Body() changeSlugDto: ChangeSlugDto,
  ) {
    const result = await this.projectService.changeSlug(
      projectId,
      changeSlugDto,
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

  /**
   * Endpoint untuk mendapatkan daftar semua tech stack yang tersedia
   * /projects/tech-stacks
   */
  @Get('/tech-stacks/lists')
  async getAllTechStackList(@Query('search') query: string) {
    const { data } = await this.projectService.findAllTechstack(query);
    return ResponseBuilder.success(data);
  }

  /**
   * Endpoint untuk memperbarui tech stack pada project (Membutuhkan otentikasi)
   * PATCH /projects/:projectId/tech-stacks
   */
  @Patch(':projectId/tech-stacks')
  @UseGuards(JwtAuthGuard)
  async updateTechStack(
    @Param('projectId', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    throw new NotImplementedException({ id, ...updateProjectDto });
  }

  /**
   * Endpoint untuk memperbarui detail project (Membutuhkan otentikasi)
   * PATCH /projects/:projectId/project-details
   */
  @Patch(':projectId/project-details')
  @UseGuards(JwtAuthGuard)
  async updateProjectDetail(
    @Param('projectId', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    throw new NotImplementedException({ id, ...updateProjectDto });
  }

  /**
   * Endpoint untuk mendapatkan semua gambar dari sebuah project (Membutuhkan otentikasi)
   * GET /projects/:projectId/images
   */
  @Get(':projectId/images')
  @UseGuards(JwtAuthGuard)
  async getAllProjectImages(@Param('projectId', ParseIntPipe) id: number) {
    throw new NotImplementedException({ id });
  }

  /**
   * Endpoint untuk mengunggah gambar project (Membutuhkan otentikasi)
   * Akan mengembalikan presigned URL untuk upload.
   * POST /projects/:projectId/images
   */
  @Post(':projectId/images')
  @UseGuards(JwtAuthGuard)
  async uploadProjectImages(
    @Param('projectId', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    // Endpoint ini harus return presigned URL dan upload image satu per satu dari frontend
    throw new NotImplementedException({ id, ...updateProjectDto });
  }

  /**
   * Endpoint untuk menetapkan gambar utama/primary (Membutuhkan otentikasi)
   * PATCH /projects/:projectId/images
   */
  @Patch(':projectId/images')
  @UseGuards(JwtAuthGuard)
  async setPrimaryImage(
    @Param('projectId', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    throw new NotImplementedException({ id, ...updateProjectDto });
  }

  /**
   * Endpoint untuk menghapus gambar project berdasarkan imageId (Membutuhkan otentikasi)
   * DELETE /projects/:projectId/images/:imageId
   */
  @Delete(':projectId/images/:imageId')
  @UseGuards(JwtAuthGuard)
  async deleteProjectImage(@Param('projectId', ParseIntPipe) id: number) {
    throw new NotImplementedException({ id });
  }

  /**
   * Endpoint untuk mendapatkan semua testimoni dari sebuah project (Membutuhkan otentikasi)
   * GET /projects/:projectId/testimonials
   */
  @Get(':projectId/testimonials')
  @UseGuards(JwtAuthGuard)
  async getAllTestimonials(@Param('projectId', ParseIntPipe) id: number) {
    throw new NotImplementedException({ id });
  }

  /**
   * Endpoint untuk membuat testimoni baru untuk project (Membutuhkan otentikasi)
   * POST /projects/:projectId/testimonials
   */
  @Post(':projectId/testimonials')
  @UseGuards(JwtAuthGuard)
  async createTestimonials(
    @Param('projectId', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    throw new NotImplementedException({ id, ...updateProjectDto });
  }

  /**
   * Endpoint untuk mengedit testimoni berdasarkan testimonialId (Membutuhkan otentikasi)
   * PATCH /projects/:projectId/testimonials/:testimonialId
   */
  @Patch(':projectId/testimonials/:testimonialId')
  @UseGuards(JwtAuthGuard)
  async editTestimonials(
    @Param('projectId', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    throw new NotImplementedException({ id, ...updateProjectDto });
  }

  /**
   * Endpoint untuk menghapus testimoni berdasarkan testimonialId (Membutuhkan otentikasi)
   * DELETE /projects/:projectId/testimonials/:testimonialId
   */
  @Delete(':projectId/testimonials/:testimonialId')
  @UseGuards(JwtAuthGuard)
  async deleteTestimonial(
    @Param('projectId', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    throw new NotImplementedException({ id, ...updateProjectDto });
  }
}
