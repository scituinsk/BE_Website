import { IsString, IsInt, Max, Min, Matches } from 'class-validator';

export class UploadProjectImageDto {
  @IsString()
  @Matches(/^[\w,\s-]+\.[A-Za-z0-9]{1,5}$/, {
    message: 'fileName tidak valid',
  })
  fileName: string;

  @IsString()
  fileType: string;

  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024, { message: 'fileSize maksimal 5MB' })
  fileSize: number;
}
