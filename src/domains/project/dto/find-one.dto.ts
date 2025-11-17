import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class FindOneProjectDto {
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  slug: string;
}
