import {
  IsInt,
  IsString,
  IsUrl,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncTechnologyDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsUrl()
  logoUrl: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

export class SyncTechnologiesDto {
  @ValidateNested({ each: true })
  @Type(() => SyncTechnologyDto)
  technologies: SyncTechnologyDto[];
}
