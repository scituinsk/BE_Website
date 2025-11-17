// import { IsOptional, IsEnum, IsString } from 'class-validator';
// import { ProjectEnvironment } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class QueryProjectsDto extends PaginationDto {
  // @IsOptional()
  // @IsEnum(ProjectEnvironment)
  // environment?: ProjectEnvironment;
  // @IsOptional()
  // @IsString()
  // search?: string;
  // @IsOptional()
  // @IsString()
  // limit?: string;
}
