# Logging Implementation Guide

## Overview

Aplikasi ini menggunakan **Winston** sebagai logging library yang terintegrasi dengan NestJS melalui `nest-winston`. Implementasi ini mengikuti best practices dari dokumentasi resmi NestJS.

## Features

### 1. **Structured Logging**

- Development: Colored console output dengan format yang mudah dibaca
- Production: JSON format untuk easy parsing dan analysis

### 2. **Multiple Transports**

- **Console**: Real-time logs di terminal
- **File (combined.log)**: Semua logs
- **File (error.log)**: Error logs only
- **File (prisma.log)**: Database query logs (development only)

### 3. **Log Levels**

- `error`: Error messages
- `warn`: Warning messages
- `info`: Informational messages
- `debug`: Debug messages (development only)

### 4. **Context-Aware Logging**

Setiap log memiliki context untuk memudahkan tracking:

- `Bootstrap`: Application startup
- `PrismaService`: Database connection
- `PrismaQuery`: Database queries
- `AuthService`: Authentication operations
- dll.

## Configuration

### Environment Variables

```env
# NODE_ENV
NODE_ENV=development  # atau 'production'

# LOG_LEVEL
LOG_LEVEL=debug  # Options: error, warn, info, debug
```

### Log Level Behavior

- **Production**: Default `info` (tidak log query & debug info)
- **Development**: Default `debug` (log semua termasuk query)

## File Structure

```
logs/
├── combined.log    # All logs (JSON format)
├── error.log       # Error logs only
└── prisma.log      # Database queries (dev only)
```

## Usage in Code

### Basic Logging

```typescript
import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class MyService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  doSomething() {
    this.logger.log('Doing something', 'MyService');
    this.logger.debug('Debug info', 'MyService');
    this.logger.warn('Warning message', 'MyService');
    this.logger.error('Error occurred', 'MyService');
  }
}
```

### Logging with Metadata

```typescript
this.logger.log('User logged in', 'AuthService', {
  userId: 123,
  username: 'john',
});
```

## Prisma Query Logging

### Development

Query logs ditampilkan dengan format:

```
2025-11-02 23:16:46 [debug] [PrismaQuery] Query: SELECT * FROM users - Duration: 5ms
```

### Production

Query logs **tidak ditampilkan** di console untuk performance, tetapi tetap tersimpan di `prisma.log`.

## Performance Investigation

### Slow Query Detection

Check `logs/prisma.log` untuk menemukan slow queries:

```bash
# Find queries > 100ms
grep -E "Duration: [0-9]{3,}ms" logs/prisma.log
```

### Error Analysis

```bash
# View error logs
cat logs/error.log | jq '.'

# Count errors by context
cat logs/error.log | jq '.context' | sort | uniq -c
```

### Request Analysis

```bash
# View all logs in readable format
cat logs/combined.log | jq '.'

# Filter by level
cat logs/combined.log | jq 'select(.level == "error")'
```

## Log Rotation (Recommended for Production)

Install winston-daily-rotate-file:

```bash
npm install --save winston-daily-rotate-file
```

Add to winston.config.ts:

```typescript
new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
});
```

## Benefits

✅ **Clean Terminal**: Tidak ada Prisma query spam di terminal production
✅ **Structured Logs**: JSON format untuk easy parsing
✅ **Context Tracking**: Tahu logs dari mana
✅ **Performance Analysis**: Track slow queries via logs
✅ **Error Investigation**: Stack traces tersimpan di file
✅ **Production Ready**: Different behavior untuk dev vs prod
✅ **Centralized Config**: Semua config di satu file

## Tips

1. **Development**: Set `LOG_LEVEL=debug` untuk melihat semua logs termasuk queries
2. **Production**: Set `LOG_LEVEL=info` atau `warn` untuk performance
3. **Debugging**: Gunakan logs files untuk investigasi issues
4. **Monitoring**: Integrate dengan logging services (Datadog, LogRocket, etc.)
