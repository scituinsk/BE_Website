import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class UpdateSlugDto {
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  slug: string;
}
