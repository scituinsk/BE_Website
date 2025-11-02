import * as winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format untuk development
const developmentFormat = printf(
  ({ timestamp, level, message, context, trace, ...metadata }) => {
    let msg = `${timestamp} [${level}] ${context ? `[${context}]` : ''} ${message}`;

    // Add metadata jika ada
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    // Add stack trace jika ada error
    if (trace) {
      msg += `\n${trace}`;
    }

    return msg;
  },
);

// Custom format untuk production (JSON)
const productionFormat = winston.format.json();

export const createWinstonConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

  return {
    transports: [
      // Console transport
      new winston.transports.Console({
        level: logLevel,
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          isProduction
            ? productionFormat
            : combine(colorize({ all: true }), developmentFormat),
        ),
      }),

      // File transport untuk errors
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: combine(
          timestamp(),
          errors({ stack: true }),
          winston.format.json(),
        ),
      }),

      // File transport untuk semua logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        level: logLevel,
        format: combine(
          timestamp(),
          errors({ stack: true }),
          winston.format.json(),
        ),
      }),

      // File transport khusus untuk Prisma queries (hanya development)
      ...(isProduction
        ? []
        : [
            new winston.transports.File({
              filename: 'logs/prisma.log',
              level: 'debug',
              format: combine(timestamp(), winston.format.json()),
            }),
          ]),
    ],
    // Jangan keluar saat terjadi unhandled exception
    exitOnError: false,
  };
};
