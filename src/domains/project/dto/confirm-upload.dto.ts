import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class ConfirmUploadDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
