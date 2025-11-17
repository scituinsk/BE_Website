import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateImageDto {
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsBoolean()
  @IsOptional()
  isUsed?: boolean;
}
