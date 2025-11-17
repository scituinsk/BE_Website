import { IsString } from 'class-validator';

export class FindOneDivisionParams {
  @IsString()
  divisionSlug: string;
}
