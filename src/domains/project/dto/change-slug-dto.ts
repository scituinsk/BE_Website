import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class ChangeSlugDto {
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  slug: string;
}
