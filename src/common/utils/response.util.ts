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
    pagination: {
      page: number;
      perPage: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      nextPage?: number | null;
      prevPage?: number | null;
    },
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
}
