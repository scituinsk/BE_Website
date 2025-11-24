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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseBuilder } from 'src/common/utils/response.util';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * Endpoint ini untuk mendapatkan list project dengan pagination, filter, dan sorting
   * /projects
   */
  @Get('/')
  async findAll(@Query() query: QueryProjectsDto) {
    console.log(query);

    const projects = await this.projectService.findAll();
    return ResponseBuilder.success(projects);
  }

  /**
   * Endpoint untuk mendapatkan satu project berdasarkan projectId
   * /projects/:projectId
   */
  @Get(':projectId')
  async findOne(@Param('projectId', ParseIntPipe) projectId: number) {
    const project = await this.projectService.findById(projectId);

    return ResponseBuilder.success(project);
  }

  /**
   * Endpoint untuk membuat project baru (Membutuhkan otentikasi)
   * POST /projects
   */
  @Post('/')
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProjectDto: CreateProjectDto) {
    const project = await this.projectService.create(createProjectDto);

    return ResponseBuilder.success(project, 'Project created successfully');
  }

  /**
   * Endpoint untuk memperbarui slug project (Membutuhkan otentikasi)
   * PATCH /projects/:projectId
   */
  @Patch('/:projectId')
  @UseGuards(JwtAuthGuard)
  async updateSlug(@Body() updateProjectDto: UpdateProjectDto) {
    throw new NotImplementedException({ ...updateProjectDto });
  }

  /**
   * Endpoint untuk menghapus project berdasarkan projectId (Membutuhkan otentikasi)
   * DELETE /projects/:projectId
   */
  @Delete(':projectId')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('projectId', ParseIntPipe) id: number) {
    const deletedProject = await this.projectService.delete(id);
    return ResponseBuilder.success(
      deletedProject,
      'Project deleted successfully',
    );
  }

  /**
   * Endpoint untuk memperbarui informasi dasar project (Membutuhkan otentikasi)
   * PATCH /projects/:projectId/basic-infos
   */
  @Patch(':projectId/basic-infos')
  @UseGuards(JwtAuthGuard)
  async updateBasicInfo(
    @Param('projectId', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    throw new NotImplementedException({ id, ...updateProjectDto });
  }

  /**
   * Endpoint untuk mendapatkan daftar semua tech stack yang tersedia
   * /projects/tech-stacks/lists
   */
  @Get('/tech-stacks/lists')
  async getAllTechStackList(@Query() query: QueryProjectsDto) {
    throw new NotImplementedException(query);
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
