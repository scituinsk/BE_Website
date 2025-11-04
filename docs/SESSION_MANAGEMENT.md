# Session Management & User Image Implementation

## 📋 Ringkasan Perubahan

### 1. **Prisma Schema**

- ✅ Menambahkan model `Session` untuk mendukung multiple sessions per user
- ✅ Menambahkan field `image` pada model `User` untuk Gravatar URL
- ✅ Menghapus field `refreshToken` dari model `User` (dipindah ke `Session`)

### 2. **Services yang Diupdate**

#### **SessionService** (Baru)

- `createSession()` - Membuat session baru saat login
- `findSessionByToken()` - Mencari session berdasarkan refresh token
- `findUserSessions()` - Mendapatkan semua session user
- `updateSession()` - Update refresh token pada session
- `deleteSession()` - Hapus session tertentu (logout single device)
- `deleteUserSessions()` - Hapus semua session user (logout all devices)
- `cleanupExpiredSessions()` - Hapus session yang expired

#### **UserService**

- ✅ Update `create()` untuk generate Gravatar URL otomatis
- ✅ Tambah method `generateGravatarUrl()` untuk membuat URL Gravatar
- ✅ Hapus method `updateRefreshToken()` (sudah tidak dipakai)

#### **AuthService**

- ✅ Update `signIn()` untuk membuat session baru dengan device info & IP
- ✅ Update `refreshTokens()` untuk validate session dan update token
- ✅ Update `logout()` untuk hapus session tertentu
- ✅ Tambah `logoutAll()` untuk hapus semua session user
- ✅ Tambah helper `calculateTokenExpiration()` untuk hitung expiration date

### 3. **Controller Updates**

#### **AuthController**

- ✅ Update `signIn()` untuk capture device info dan IP address
- ✅ Update `logout()` untuk menggunakan refresh token dari request
- ✅ Tambah endpoint `POST /auth/logout-all` untuk logout dari semua device

## 🔧 Cara Migrasi Database

Ketika database sudah online, jalankan:

```bash
npx prisma migrate dev --name add-session-model-and-user-image
```

Atau untuk force sync schema tanpa migration history:

```bash
npx prisma db push
```

## 📝 API Endpoints

### **Sign Up**

```http
POST /auth/signup
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "username": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "image": "https://www.gravatar.com/avatar/c4ca4238a0b923820dcc509a6f75849b?s=500&d=retro&r=g"
  }
}
```

### **Sign In**

```http
POST /auth/signin
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "image": "https://www.gravatar.com/avatar/c4ca4238a0b923820dcc509a6f75849b?s=500&d=retro&r=g"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### **Logout (Single Device)**

```http
POST /auth/logout
Authorization: Bearer {accessToken}
Cookie: refreshToken={refreshToken}

Response:
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

### **Logout All Devices**

```http
POST /auth/logout-all
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "data": null
}
```

## 🎨 Gravatar Implementation

Setiap user otomatis mendapat avatar dari Gravatar berdasarkan hash MD5 dari user ID mereka:

```typescript
// Contoh URL yang dihasilkan untuk user ID 1:
// https://www.gravatar.com/avatar/c4ca4238a0b923820dcc509a6f75849b?s=500&d=retro&r=g

// Parameters:
// s=500      -> size 500x500 pixels
// d=retro    -> default image style (retro pixel art)
// r=g        -> rating (g = suitable for all audiences)
```

Anda bisa ubah parameter di `UserService.generateGravatarUrl()`:

- `d=retro` → `d=identicon`, `d=monsterid`, `d=wavatar`, dll
- `s=500` → ukuran lain (80, 200, 400, dll)

## 📊 Database Schema

### Model Session

```prisma
model Session {
  id           Int      @id @default(autoincrement())
  userId       Int
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken String   @unique
  deviceInfo   String?  // Browser/Device info
  ipAddress    String?  // IP Address
  expiresAt    DateTime // Token expiration
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([refreshToken])
}
```

**Fitur:**

- ✅ Multiple sessions per user
- ✅ Track device info dan IP untuk security
- ✅ Auto-delete sessions saat user dihapus (Cascade)
- ✅ Index untuk performa query
- ✅ Expiration tracking

## 🔐 Security Features

1. **Refresh Token Hashing**: Semua refresh token di-hash dengan bcrypt sebelum disimpan
2. **Device Tracking**: Setiap session menyimpan info device dan IP address
3. **Expiration Management**: Session otomatis expired berdasarkan JWT expiration
4. **Multiple Device Support**: User bisa login dari multiple devices
5. **Selective Logout**: Logout hanya dari device saat ini atau semua devices

## 🚀 Next Steps (Optional)

### 1. Install Schedule Module untuk Auto Cleanup

```bash
npm install @nestjs/schedule
```

Kemudian uncomment kode di `session.scheduler.ts` dan tambahkan ke `AppModule`:

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... other imports
  ],
})
export class AppModule {}
```

### 2. Tambah Endpoint untuk Manage Sessions

Buat endpoint untuk user melihat dan manage sessions mereka:

```typescript
// GET /auth/sessions - List all user sessions
// DELETE /auth/sessions/:id - Delete specific session
```

### 3. Security Enhancements

- Rate limiting untuk login attempts
- Email notification saat login dari device baru
- Session activity logging
- Suspicious activity detection

## 🐛 Troubleshooting

### Database Connection Error

Jika migration gagal karena database tidak terhubung:

1. Cek `DATABASE_URL` di file `.env`
2. Pastikan Supabase database aktif
3. Generate Prisma Client dulu: `npx prisma generate`
4. Jalankan migration nanti saat database online

### Session Not Found

Jika session tidak ditemukan saat refresh:

- Session mungkin sudah expired
- Refresh token tidak valid
- User perlu login ulang
