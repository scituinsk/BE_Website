# S3 Avatar Storage Implementation

## 📋 Overview

Implementasi ini menggunakan S3-compatible storage untuk menyimpan avatar user. Avatar di-generate dari Gravatar berdasarkan user ID, kemudian di-download dan di-upload ke S3 storage sendiri.

## 🎯 Keuntungan

1. **Full Control**: Avatar tersimpan di storage sendiri
2. **Reliability**: Tidak tergantung pada Gravatar CDN
3. **Customization**: User bisa upload custom avatar
4. **Performance**: File served dari S3 CDN sendiri
5. **Security**: Kontrol akses penuh terhadap file

## 🔧 Configuration

Pastikan environment variables berikut sudah di-set di `.env`:

```env
# S3 Configuration
S3_ENDPOINT=https://your-s3-endpoint.com
S3_REGION=auto
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=my-bucket-name
```

## 🚀 How It Works

### 1. **User Registration**

```
User Sign Up
     ↓
Create User in DB (get ID)
     ↓
Generate Gravatar URL (MD5 hash of user ID)
     ↓
Download image from Gravatar
     ↓
Upload to S3 (avatars/user-{id}-{timestamp}.png)
     ↓
Store S3 URL in User.image field
```

### 2. **Avatar Storage Structure**

```
S3 Bucket
└── avatars/
    ├── user-1-1730700000000.png
    ├── user-2-1730700100000.png
    └── user-3-1730700200000.png
```

### 3. **Custom Avatar Upload**

User dapat upload custom avatar yang akan replace Gravatar:

```
Upload Custom Image
     ↓
Delete old avatar from S3
     ↓
Upload new image to S3
     ↓
Update User.image with new S3 URL
```

## 📝 API Endpoints

### **Get Current User**

```http
GET /users/me
Authorization: Bearer {accessToken}

Response:
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "john@example.com",
    "role": "USER",
    "image": "https://s3-endpoint.com/bucket/avatars/user-1-1730700000000.png",
    "createdAt": "2025-11-04T...",
    "updatedAt": "2025-11-04T..."
  }
}
```

### **Get User by ID**

```http
GET /users/:id
Authorization: Bearer {accessToken}

Response: Same as above
```

### **Upload Custom Avatar**

```http
POST /users/me/avatar
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

FormData:
- file: [image file] (optional)

# If no file provided, regenerate from Gravatar

Response:
{
  "statusCode": 200,
  "message": "Avatar updated successfully",
  "data": {
    "image": "https://s3-endpoint.com/bucket/avatars/user-1-1730700500000.png"
  }
}
```

### **Delete Avatar**

```http
DELETE /users/me/avatar
Authorization: Bearer {accessToken}

Response:
{
  "statusCode": 200,
  "message": "Avatar deleted successfully",
  "data": null
}
```

## 💻 Code Examples

### **Upload Custom Avatar (Frontend)**

```javascript
// Using fetch API
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/users/me/avatar', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  body: formData,
});

const result = await response.json();
console.log('New avatar URL:', result.data.image);
```

### **Regenerate from Gravatar**

```javascript
// No file = regenerate from Gravatar
const response = await fetch('http://localhost:3000/users/me/avatar', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});
```

### **Using in Service**

```typescript
// Get user with avatar
const user = await this.userService.findById(userId);
console.log(user.image); // S3 URL

// Update avatar with file
const newUrl = await this.userService.updateAvatar(userId, file);

// Regenerate from Gravatar
const newUrl = await this.userService.updateAvatar(userId);

// Delete avatar
await this.userService.deleteAvatar(userId);
```

## 🏗️ Architecture

### **S3Service Methods**

```typescript
// Upload from multer file
uploadFile(file: Express.Multer.File, folder?: string): Promise<string>

// Upload from URL (Gravatar)
uploadFromUrl(url: string, fileName: string, folder?: string): Promise<string>

// Upload from buffer
uploadBuffer(buffer: Buffer, fileName: string, contentType?: string, folder?: string): Promise<string>

// Delete file
deleteFile(fileUrl: string): Promise<void>

// Check if exists
fileExists(key: string): Promise<boolean>
```

### **UserService Methods**

```typescript
// Generate and upload avatar from Gravatar
generateAndUploadAvatar(userId: number): Promise<string>

// Generate Gravatar URL
generateGravatarUrl(userId: number): string

// Update avatar (custom or regenerate)
updateAvatar(userId: number, file?: Express.Multer.File): Promise<string>

// Delete avatar
deleteAvatar(userId: number): Promise<void>
```

## 🔍 Testing

### 1. **Test Sign Up with Avatar**

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Check response for S3 image URL
```

### 2. **Test Custom Avatar Upload**

```bash
curl -X POST http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/image.jpg"
```

### 3. **Test Avatar Deletion**

```bash
curl -X DELETE http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer {token}"
```

## 🛡️ Security Considerations

1. **File Type Validation**: Tambahkan validation untuk accept hanya image files
2. **File Size Limit**: Set max upload size (e.g., 5MB)
3. **Virus Scanning**: Consider scanning uploaded files
4. **Access Control**: Only authenticated users can upload/delete

### **Add File Validation** (Recommended)

```typescript
// In UserController
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';

@Post('me/avatar')
@UseInterceptors(FileInterceptor('file'))
async updateAvatar(
  @CurrentUser() user: any,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        new FileTypeValidator({ fileType: /image\/(jpeg|jpg|png|gif)/ }),
      ],
      fileIsRequired: false,
    }),
  )
  file?: Express.Multer.File,
) {
  // ...
}
```

## 📊 Database Schema

```prisma
model User {
  id       Int      @id @default(autoincrement())
  name     String
  username String   @unique
  password String
  image    String?  // S3 URL: https://endpoint/bucket/avatars/user-X-timestamp.png
  role     Role     @default(USER)
  sessions Session[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔄 Migration Path

### **From Gravatar URL to S3**

Jika sudah ada users dengan Gravatar URL, buat migration script:

```typescript
// scripts/migrate-avatars-to-s3.ts
import { PrismaClient } from '../../../generated/prisma/client';
import { S3Service } from './src/infrastructure/s3/s3.service';

async function migrateAvatars() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({
    where: {
      image: {
        startsWith: 'https://www.gravatar.com',
      },
    },
  });

  for (const user of users) {
    // Download and upload to S3
    const fileName = `user-${user.id}-${Date.now()}.png`;
    const s3Url = await s3Service.uploadFromUrl(
      user.image,
      fileName,
      'avatars',
    );

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { image: s3Url },
    });

    console.log(`Migrated avatar for user ${user.id}`);
  }
}
```

## ⚡ Performance Tips

1. **CDN**: Use S3 endpoint dengan CDN untuk faster delivery
2. **Image Optimization**: Compress images sebelum upload
3. **Lazy Loading**: Load avatar hanya saat dibutuhkan
4. **Caching**: Cache avatar URLs di frontend
5. **Async Upload**: Upload avatar async setelah user creation

## 🐛 Troubleshooting

### **Error: "Failed to download from Gravatar"**

- Check internet connection
- Gravatar might be down
- Fallback: Create user without avatar first

### **Error: "Failed to upload to S3"**

- Check S3 credentials in .env
- Verify bucket exists
- Check S3 endpoint accessibility

### **Avatar Not Showing**

- Check S3 bucket permissions (public read)
- Verify S3 URL format
- Check CORS settings on S3

## 📚 Related Files

```
src/
├── infra/
│   └── s3/
│       ├── s3.service.ts       ← S3 upload/download/delete
│       └── s3.module.ts        ← S3 module export
├── domains/
│   └── user/
│       ├── user.service.ts     ← Avatar management
│       ├── user.controller.ts  ← Avatar endpoints
│       └── user.module.ts      ← Import S3Module
```

## 🎉 Features Summary

- ✅ Auto-generate avatar from Gravatar on sign up
- ✅ Upload avatar dari Gravatar ke S3
- ✅ Custom avatar upload
- ✅ Regenerate avatar dari Gravatar
- ✅ Delete avatar
- ✅ Auto-cleanup old avatar saat update
- ✅ Error handling & logging
- ✅ RESTful API endpoints

---

**Next Steps:**

1. Configure S3 bucket dengan public read access
2. Test avatar upload/download
3. Add file validation untuk security
4. Implement image optimization (optional)
5. Setup CDN untuk S3 (optional)
