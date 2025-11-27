export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export class ResponseBuilder {
  static success<T>(data: T, message?: string) {
    return {
      statusCode: 200,
      message: message || 'Success',
      data,
    };
  }

  static successWithPagination<T>(
    data: T,
    pagination: PaginationMeta,
    message?: string,
  ) {
    return {
      statusCode: 200,
      message: message || 'Success',
      data,
      pagination,
    };
  }

  static created<T>(data: T, message?: string) {
    return {
      statusCode: 201,
      message: message || 'Created successfully',
      data,
    };
  }

  static noContent(message?: string) {
    return {
      statusCode: 204,
      message: message || 'No content',
    };
  }

  static buildPaginationMeta(
    page: number,
    perPage: number,
    total: number,
  ): PaginationMeta {
    return {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
