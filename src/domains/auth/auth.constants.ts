// JWT Token Expiration
export const JWT_ACCESS_TOKEN_EXPIRATION = '15m';
export const JWT_REFRESH_TOKEN_EXPIRATION = '7d';

// Cookie Expiration (in milliseconds)
export const COOKIE_ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
export const COOKIE_REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cookie Names
export const COOKIE_ACCESS_TOKEN_NAME = 'accessToken';
export const COOKIE_REFRESH_TOKEN_NAME = 'refreshToken';

// Bcrypt
export const BCRYPT_SALT_ROUNDS = 10;
