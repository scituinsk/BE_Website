export class ResponseUtil {
  static success<T>(data: T, message?: string) {
    return {
      statusCode: 200,
      message: message || 'Success',
      data,
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
