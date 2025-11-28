import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from 'src/dto/pagination.dto';
import { ALLOWED_PROJECT_SORT_FIELDS } from '../project.constants';

export class QueryProjectsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  // Override sort_by untuk validasi field yang diperbolehkan
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_PROJECT_SORT_FIELDS, {
    message: `sort_by must be one of: ${ALLOWED_PROJECT_SORT_FIELDS.join(', ')}`,
  })
  declare sort_by?: string;
}
