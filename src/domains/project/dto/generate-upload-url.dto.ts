import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class GenerateUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
