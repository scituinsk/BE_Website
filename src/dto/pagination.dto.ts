import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsIn, IsString } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(50)
  per_page: number = 10;

  // SORTING FIELD
  @IsOptional()
  @IsString()
  sort_by?: string;

  // SORT ORDER
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order: 'asc' | 'desc' = 'asc';
}
