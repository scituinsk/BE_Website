import { IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  linkDemo?: string;

  @IsString()
  @IsOptional()
  duration: string;

  @IsString()
  @IsOptional()
  launchYear: string;
}
