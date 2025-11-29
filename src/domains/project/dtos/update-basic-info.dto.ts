import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ProjectStatus } from '@prisma/client';

export class UpdateBasicInfoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  launchYear?: string;

  @IsOptional()
  @IsString()
  demoUrl?: string;
}
