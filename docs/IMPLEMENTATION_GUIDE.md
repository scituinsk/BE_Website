# Implementasi Autentikasi JWT dengan Passport

## Arsitektur

Implementasi ini mengikuti best practices dari dokumentasi resmi NestJS dengan menggunakan:

- **Passport Local Strategy** untuk autentikasi username/password
- **Passport JWT Strategy** untuk validasi access token
- **Passport JWT Refresh Strategy** untuk validasi refresh token
- **Bcrypt** untuk hashing password dan refresh token
- **Prisma ORM** untuk database operations

## Struktur File

```
src/domains/auth/
├── dto/
│   ├── signin.dto.ts          # DTO untuk login
│   ├── signup.dto.ts          # DTO untuk registrasi
│   └── refresh-token.dto.ts   # DTO untuk refresh token
├── guards/
│   ├── local-auth.guard.ts    # Guard untuk local strategy
│   ├── jwt-auth.guard.ts      # Guard untuk JWT access token
│   └── jwt-refresh-auth.guard.ts  # Guard untuk JWT refresh token
├── strategies/
│   ├── local.strategy.ts      # Passport local strategy
│   ├── jwt.strategy.ts        # Passport JWT strategy
│   └── jwt-refresh.strategy.ts    # Passport JWT refresh strategy
├── auth.controller.ts         # Controller dengan endpoints
├── auth.service.ts            # Business logic
└── auth.module.ts            # Module configuration
```

## Flow Autentikasi

### 1. Sign Up (Registrasi)

```
Client → POST /auth/signup
       → Validasi DTO
       → Cek username sudah ada?
       → Hash password dengan bcrypt
       → Simpan user ke database
       → Return user info
```

### 2. Sign In (Login)

```
Client → POST /auth/signin
       → LocalAuthGuard aktif
       → LocalStrategy.validate() dipanggil
       → Cek username & password dengan bcrypt
       → Generate access token (15 menit)
       → Generate refresh token (7 hari)
       → Hash refresh token
       → Simpan hashed refresh token ke database
       → Return user info + tokens
```

### 3. Access Protected Route

```
Client → GET /auth/profile (dengan Authorization header)
       → JwtAuthGuard aktif
       → JwtStrategy.validate() dipanggil
       → Extract token dari header
       → Verify token dengan JWT_SECRET
       → Return payload (userId, username, email)
```

### 4. Refresh Access Token

```
Client → POST /auth/refresh (dengan refresh token di body)
       → JwtRefreshAuthGuard aktif
       → JwtRefreshStrategy.validate() dipanggil
       → Verify refresh token dengan JWT_REFRESH_SECRET
       → Cek hash refresh token di database
       → Generate tokens baru
       → Update hashed refresh token di database
       → Return tokens baru
```

### 5. Logout

```
Client → POST /auth/logout (dengan access token)
       → JwtAuthGuard aktif
       → Set refreshToken = null di database
       → Return success message
```

## Security Features

1. **Password Hashing**: Menggunakan bcrypt dengan salt rounds 10
2. **Refresh Token Hashing**: Refresh token di-hash sebelum disimpan di database
3. **Token Expiration**:
   - Access token: 15 menit (singkat untuk keamanan)
   - Refresh token: 7 hari
4. **Validation**: Menggunakan class-validator di semua DTOs
5. **Guards**: Semua protected routes menggunakan guards

## Environment Variables

Pastikan file `.env` memiliki:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=3000
```

## Database Schema

```prisma
model User {
  id            Int      @id @default(autoincrement())
  email         String   @unique
  username      String   @unique
  password      String   // Hashed dengan bcrypt
  name          String?
  refreshToken  String?  // Hashed refresh token
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  posts         Post[]
}
```

## Testing dengan Postman/Thunder Client

1. **Register**:

   ```
   POST http://localhost:3000/auth/signup
   Body: { "email", "username", "password", "name" }
   ```

2. **Login**:

   ```
   POST http://localhost:3000/auth/signin
   Body: { "username", "password" }
   Response: { user, accessToken, refreshToken }
   ```

3. **Get Profile**:

   ```
   GET http://localhost:3000/auth/profile
   Header: Authorization: Bearer <accessToken>
   ```

4. **Refresh Token**:

   ```
   POST http://localhost:3000/auth/refresh
   Body: { "refreshToken": "<refreshToken>" }
   ```

5. **Logout**:
   ```
   POST http://localhost:3000/auth/logout
   Header: Authorization: Bearer <accessToken>
   ```

## Next Steps

1. Run migrations: `npx prisma migrate dev`
2. Start server: `npm run dev`
3. Test endpoints dengan Postman/Thunder Client
4. Tambahkan role-based access control (RBAC) jika diperlukan
5. Implementasi rate limiting untuk security
6. Tambahkan email verification
7. Implementasi forgot password feature
