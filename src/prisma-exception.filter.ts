import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientValidationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost) {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          const field = extractConstraintField(exception.meta);
          throw new ConflictException(
            `Unique constraint failed on field: ${field}`,
          );
        }

        case 'P2025':
          throw new NotFoundException('Record not found');
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException('Invalid data provided');
    }

    throw new InternalServerErrorException('Internal server error');
  }
}

function extractConstraintField(meta: any): string {
  return (
    meta?.target ??
    meta?.constraint?.fields ??
    meta?.driverAdapterError?.constraint?.fields ??
    meta?.driverAdapterError?.cause?.constraint?.fields ??
    'unknown-field'
  );
}
