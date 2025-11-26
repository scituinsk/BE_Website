import { IsInt, IsString, IsUrl, Min, Max } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsString()
  testimonial: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsUrl()
  avatarUrl: string;
}
