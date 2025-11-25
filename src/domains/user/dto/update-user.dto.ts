import { PartialType } from '@nestjs/mapped-types';
import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Role } from 'generated/prisma/enums';
import { SignUpDto } from 'src/domains/auth/dto/signup.dto';

export class UpdateUserDto extends PartialType(SignUpDto) {
  @IsNumber()
  @IsNotEmpty()
  @IsDefined()
  userId: number;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
