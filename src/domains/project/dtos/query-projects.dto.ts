import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/dto/pagination.dto';

export class QueryProjectsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
