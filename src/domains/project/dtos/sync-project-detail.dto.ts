import { IsString, IsInt, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncFeatureDto {
  @IsInt()
  id: number;

  @IsInt()
  projectId: number;

  @IsString()
  feature: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

export class SyncChallengeDto {
  @IsInt()
  id: number;

  @IsInt()
  projectId: number;

  @IsString()
  challenge: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

export class SyncResultDto {
  @IsInt()
  id: number;

  @IsInt()
  projectId: number;

  @IsString()
  result: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

export class SyncProjectDetailsDto {
  @IsString()
  aboutProject: string;

  @ValidateNested({ each: true })
  @Type(() => SyncFeatureDto)
  features: SyncFeatureDto[];

  @ValidateNested({ each: true })
  @Type(() => SyncChallengeDto)
  challenges: SyncChallengeDto[];

  @ValidateNested({ each: true })
  @Type(() => SyncResultDto)
  results: SyncResultDto[];
}
