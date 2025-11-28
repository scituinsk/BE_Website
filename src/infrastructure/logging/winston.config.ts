import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

export const createWinstonConfig = (configService: ConfigService) => {
  const isDevelopment = configService.get('NODE_ENV') === 'development';

  return {
    level: configService.get('LOG_LEVEL', 'info'),
    transports: [
      new winston.transports.Console({
        format: isDevelopment
          ? winston.format.combine(
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.colorize({ all: true }),
              winston.format.printf(
                ({ timestamp, level, message, context, ...meta }) => {
                  const contextStr = context ? `[${context}]` : '';
                  const metaStr = Object.keys(meta).length
                    ? `\n${JSON.stringify(meta, null, 2)}`
                    : '';
                  return `${timestamp} ${level} ${contextStr} ${message}${metaStr}`;
                },
              ),
            )
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
      }),
      ...(isDevelopment
        ? []
        : [new winston.transports.File({ filename: 'logs/app.log' })]),
    ],
  };
};
