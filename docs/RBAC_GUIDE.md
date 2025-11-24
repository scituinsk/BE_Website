# Role-Based Access Control (RBAC) Implementation

## Overview

Implementasi Role-Based Access Control mengikuti dokumentasi resmi NestJS menggunakan:

- Custom `@Roles()` decorator
- `RolesGuard` untuk validasi role
- Prisma Enum untuk role types

## Roles

```typescript
enum Role {
  USER
  ADMIN
}
```

## Usage

### 1. Protect Endpoint dengan Role Tertentu

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../../../generated/prisma/client';

@Controller('admin')
export class AdminController {
  // Only ADMIN can access
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('dashboard')
  getDashboard() {
    return { message: 'Admin dashboard' };
  }

  // Both USER and ADMIN can access
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @Get('profile')
  getProfile() {
    return { message: 'User profile' };
  }
}
```

### 2. Multiple Roles

Endpoint dapat diakses oleh beberapa role:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Get('data')
getData() {
  // Accessible by USER or ADMIN
}
```

### 3. No Role Required (Public Authenticated)

Jika hanya butuh authentication tanpa role check:

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile() {
  // Any authenticated user
}
```

## How It Works

### 1. User Login

```typescript
// User signs in
POST /auth/signin
{
  "username": "user@example.com",
  "password": "password123"
}

// Response includes role in user object
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 2. JWT Payload

Access token payload includes role:

```json
{
  "sub": 1,
  "username": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 3. Role Validation Flow

```
Request → JwtAuthGuard → Validates JWT → Extracts user with role
       → RolesGuard → Checks if user.role matches required roles
       → If match: Allow access
       → If no match: 403 Forbidden
```

## Example Endpoints

### Available in AuthController

1. **Admin Only**

   ```
   GET /auth/admin-only
   Headers: Authorization: Bearer <token>
   Role Required: ADMIN
   ```

2. **User or Admin**

   ```
   GET /auth/user-data
   Headers: Authorization: Bearer <token>
   Role Required: USER or ADMIN
   ```

3. **Any Authenticated User**
   ```
   GET /auth/session
   Headers: Authorization: Bearer <token>
   Role Required: None (just authenticated)
   ```

## Testing

### 1. Create ADMIN User

Manually set role in database or create seeder:

```typescript
// prisma/seed.ts
await prisma.user.create({
  data: {
    username: 'admin@example.com',
    password: await bcrypt.hash('admin123', 10),
    name: 'Admin User',
    role: 'ADMIN',
  },
});
```

### 2. Test Role Access

```bash
# Login as ADMIN
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@example.com","password":"admin123"}'

# Access admin-only endpoint (should succeed)
curl http://localhost:3000/auth/admin-only \
  -H "Authorization: Bearer <admin_token>"

# Login as USER
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"user@example.com","password":"user123"}'

# Access admin-only endpoint (should fail with 403)
curl http://localhost:3000/auth/admin-only \
  -H "Authorization: Bearer <user_token>"
```

## Response Examples

### Success (200)

```json
{
  "message": "This is admin-only data",
  "user": {
    "userId": 1,
    "username": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### Forbidden (403)

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

## Important Notes

### Username is Email

- Field `username` di database sebenarnya adalah email
- Validasi menggunakan `@IsEmail()` decorator
- User login dengan email sebagai username

```typescript
// SignUpDto
{
  username: string; // This is actually email
  password: string;
  name: string;
}
```

### Default Role

- New users get `Role.USER` by default (defined in Prisma schema)
- ADMIN role harus di-set manually atau via seeder

### Guard Order Matters

```typescript
// Correct order
@UseGuards(JwtAuthGuard, RolesGuard)

// JwtAuthGuard must come first to authenticate user
// Then RolesGuard can check the role
```

## Best Practices

1. **Always combine with JwtAuthGuard**

   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(Role.ADMIN)
   ```

2. **Use Prisma Enum**

   ```typescript
   import { Role } from '../../../generated/prisma/client';
   // Type-safe!
   ```

3. **Global Guards (Optional)**

   ```typescript
   // main.ts - Apply to all routes
   app.useGlobalGuards(new RolesGuard(reflector));
   ```

4. **Custom Error Messages**
   ```typescript
   throw new ForbiddenException('You need ADMIN role to access this');
   ```

## Extending Roles

To add more roles:

1. Update Prisma schema:

   ```prisma
   enum Role {
     USER
     ADMIN
     MODERATOR
     GUEST
   }
   ```

2. Run migration:

   ```bash
   npx prisma migrate dev
   ```

3. Use in controllers:
   ```typescript
   @Roles(Role.ADMIN, Role.MODERATOR)
   ```
