# Project Image Upload Guide

## Overview

Implementasi upload image untuk project menggunakan presigned URL S3. Flow ini memungkinkan client untuk upload langsung ke S3 tanpa melalui backend server, kemudian melakukan konfirmasi setelah upload berhasil.

## Flow Upload

### 1. Initiate Upload (Get Presigned URL)

**Endpoint:** `POST /projects/:projectId/images/upload`

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```json
{
  "fileName": "project-screenshot.png",
  "fileType": "image/png",
  "fileSize": 1048576
}
```

**Validation Rules:**

- `fileName`: Harus valid filename dengan ekstensi (max 5 karakter)
- `fileType`: String untuk MIME type
- `fileSize`: Integer, min 1 byte, max 5MB (5242880 bytes)

**Response Success (200):**

```json
{
  "success": true,
  "message": "Presigned URL generated successfully",
  "data": {
    "id": 123,
    "uploadUrl": "https://s3.endpoint.com/bucket/projects/1732569600000-project-screenshot.png?signature=...",
    "fileUrl": "https://s3.endpoint.com/bucket/projects/1732569600000-project-screenshot.png",
    "key": "projects/1732569600000-project-screenshot.png",
    "message": "Upload file ke URL yang diberikan, kemudian confirm dengan ID image ini"
  }
}
```

**Response Error:**

- `404`: Project tidak ditemukan
- `400`: Validation error (fileName, fileType, fileSize invalid)
- `401`: Unauthorized (token invalid/expired)

---

### 2. Upload File ke S3

Client melakukan **PUT request** ke `uploadUrl` yang diberikan dari step 1.

**Example using JavaScript/Fetch:**

```javascript
const file = document.getElementById('fileInput').files[0];

const response = await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': fileType,
    'x-amz-acl': 'public-read', // PENTING: Set ACL agar file public
  },
  body: file,
});

if (response.ok) {
  // Upload berhasil, lanjut ke step 3
  console.log('Upload to S3 successful');
}
```

**Example using Axios:**

```javascript
const file = document.getElementById('fileInput').files[0];

await axios.put(uploadUrl, file, {
  headers: {
    'Content-Type': fileType,
    'x-amz-acl': 'public-read', // PENTING: Set ACL agar file public
  },
});
```

**Important Notes:**

- Gunakan **PUT** method (bukan POST)
- Set header `Content-Type` sesuai dengan fileType yang dikirim di step 1
- **WAJIB set header `x-amz-acl: public-read`** agar file dapat diakses public
- Body adalah raw file (buffer/blob)
- Upload URL expire dalam 1 jam (3600 detik)
- Jika upload gagal/timeout, ulangi dari step 1

---

### 3. Confirm Upload

**Endpoint:** `POST /projects/:projectId/images/:imageId/confirm`

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Path Parameters:**

- `projectId`: ID project (dari step 1)
- `imageId`: ID image yang di-return dari step 1 (field `data.id`)

**Response Success (200):**

```json
{
  "success": true,
  "message": "Upload confirmed successfully",
  "data": {
    "id": 123,
    "fileName": "project-screenshot.png",
    "fileUrl": "https://s3.endpoint.com/bucket/projects/1732569600000-project-screenshot.png",
    "key": "projects/1732569600000-project-screenshot.png",
    "isPrimary": false,
    "message": "Upload berhasil dikonfirmasi"
  }
}
```

**Response Error:**

- `404`: Project atau image tidak ditemukan
- `400`: File tidak ditemukan di S3 (upload gagal atau belum dilakukan)
  - Jika terjadi error ini, record image akan dihapus dari database
  - User harus ulangi dari step 1
- `401`: Unauthorized

---

## Implementation Flow Diagram

```
Client                          Backend                         S3
  |                                |                             |
  |--1. POST /images/upload------->|                             |
  |                                |--Create DB record---------->|
  |<--Return presigned URL---------|                             |
  |                                |                             |
  |--2. PUT (file) to presigned URL----------------------------->|
  |<--Upload confirmation------------------------------------------
  |                                |                             |
  |--3. POST /images/:id/confirm-->|                             |
  |                                |--Verify file exists-------->|
  |                                |<--File exists confirmation--|
  |<--Confirmation response--------|                             |
```

---

## Error Handling

### Scenario 1: Upload to S3 Failed

Jika upload ke S3 gagal di step 2:

1. User ulangi dari step 1 untuk mendapatkan presigned URL baru
2. Record lama di database akan tetap ada (dengan `isUsed = true`)
3. Saat confirm, akan mendapat error 400 dan record akan di-flag `isUsed = false`
4. Orphan record akan dihapus otomatis oleh cron job (setiap hari jam 4 pagi)

### Scenario 2: Confirm Failed

Jika confirm gagal di step 3:

1. Coba confirm ulang dengan imageId yang sama
2. Jika masih gagal dengan error 400, record akan di-flag `isUsed = false`
3. Ulangi dari step 1 untuk upload baru

### Scenario 3: Presigned URL Expired

Presigned URL expire dalam 1 jam:

1. Jika upload belum dilakukan dalam 1 jam, URL akan expire
2. Ulangi dari step 1 untuk mendapatkan presigned URL baru

---

## Security Notes

1. **Authentication Required**: Semua endpoint memerlukan JWT token valid
2. **Project Ownership**: System akan validasi bahwa imageId belongs to projectId
3. **File Validation**:
   - Max file size: 5MB
   - Validation dilakukan di backend sebelum generate presigned URL
4. **S3 Verification**: System memverifikasi file exists di S3 sebelum confirm
5. **Auto Cleanup**:
   - Jika file tidak ada di S3 saat confirm, record akan di-flag `isUsed = false`
   - Orphan records dihapus otomatis oleh cron job setiap hari jam 4 pagi
   - Cron job juga menghapus file dari S3 jika masih ada

---

## Orphan Files Cleanup

### Automatic Cleanup via Cron Job

System menggunakan flagging mechanism untuk handle orphan files:

1. **Flagging**: Saat confirm gagal (file tidak ada di S3), record di-flag dengan `isUsed = false`
2. **Cron Job**: Scheduler berjalan setiap hari jam 4 pagi
3. **Cleanup Process**:
   - Find semua ProjectImage dengan `isUsed = false`
   - Delete file dari S3 (jika exists)
   - Delete record dari database
   - Log hasil cleanup (total, deleted, failed)

### Implementation

**Scheduler**: `src/domains/project/project.scheduler.ts`

```typescript
@Cron(CronExpression.EVERY_DAY_AT_4AM)
async handleCleanupOrphanProjectImages() {
  const result = await this.projectService.cleanupOrphanProjectImages();
  // Logs: deleted images, failed, total
}
```

**Service Method**: `cleanupOrphanProjectImages()`

- Returns: `{ total: number, deleted: number, failed: number }`
- Safely deletes files and continues even if some fail

---

## Best Practices

### For Frontend Development

1. **Show Upload Progress**

   ```javascript
   const xhr = new XMLHttpRequest();
   xhr.upload.addEventListener('progress', (e) => {
     const percent = (e.loaded / e.total) * 100;
     console.log(`Upload progress: ${percent}%`);
   });
   xhr.open('PUT', uploadUrl);
   xhr.setRequestHeader('Content-Type', fileType);
   xhr.setRequestHeader('x-amz-acl', 'public-read'); // PENTING!
   xhr.send(file);
   ```

2. **Validate File Before Upload**

   ```javascript
   const maxSize = 5 * 1024 * 1024; // 5MB
   if (file.size > maxSize) {
     alert('File terlalu besar, maksimal 5MB');
     return;
   }
   ```

3. **Handle Errors Gracefully**

   ```javascript
   try {
     // Step 1: Get presigned URL
     const initResponse = await initiateUpload(projectId, fileData);

     // Step 2: Upload to S3 dengan ACL header
     await uploadToS3(initResponse.data.uploadUrl, file, fileType);

     // Step 3: Confirm upload
     const confirmResponse = await confirmUpload(
       projectId,
       initResponse.data.id,
     );

     alert('Upload berhasil!');
   } catch (error) {
     if (error.response?.status === 400) {
       alert('Upload gagal, silakan coba lagi');
     } else {
       alert('Terjadi kesalahan, silakan coba lagi');
     }
   }

   // Helper function
   async function uploadToS3(uploadUrl, file, fileType) {
     await fetch(uploadUrl, {
       method: 'PUT',
       headers: {
         'Content-Type': fileType,
         'x-amz-acl': 'public-read', // WAJIB!
       },
       body: file,
     });
   }
   ```

4. **Store imageId Temporarily**

   ```javascript
   // Simpan imageId untuk retry jika needed
   sessionStorage.setItem('pendingImageId', imageId);
   sessionStorage.setItem('pendingProjectId', projectId);
   ```

---

## Troubleshooting

### File Uploaded Tapi Private (403 Forbidden)

**Problem**: File berhasil di-upload ke S3 tapi saat diakses dapat error 403 Forbidden.

**Cause**: Header `x-amz-acl: public-read` tidak dikirim saat upload.

**Solution**:

```javascript
// BENAR ✅
await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': 'image/png',
    'x-amz-acl': 'public-read', // Header ini WAJIB!
  },
  body: file,
});

// SALAH ❌
await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': 'image/png',
    // Missing x-amz-acl header!
  },
  body: file,
});
```

### SignatureDoesNotMatch Error

**Problem**: Upload ke S3 gagal dengan error "SignatureDoesNotMatch".

**Possible Causes**:

1. Header `Content-Type` tidak match dengan yang di-set saat generate presigned URL
2. Header `x-amz-acl` tidak match dengan yang di-set di presigned URL

**Solution**: Pastikan header yang dikirim saat upload match dengan yang di-set saat generate presigned URL:

- `Content-Type` harus sama dengan `fileType` dari step 1
- `x-amz-acl` harus `public-read`

  // Step 2: Upload to S3
  await uploadToS3(initResponse.data.uploadUrl, file);

  // Step 3: Confirm upload
  const confirmResponse = await confirmUpload(
  projectId,
  initResponse.data.id,
  );

  alert('Upload berhasil!');
  } catch (error) {
  if (error.response?.status === 400) {
  alert('Upload gagal, silakan coba lagi');
  } else {
  alert('Terjadi kesalahan, silakan coba lagi');
  }
  }

  ```

  ```

4. **Store imageId Temporarily**
   ```javascript
   // Simpan imageId untuk retry jika needed
   sessionStorage.setItem('pendingImageId', imageId);
   sessionStorage.setItem('pendingProjectId', projectId);
   ```

---

## Testing

### Manual Testing Steps

1. **Test Happy Path:**
   - Initiate upload dengan valid data
   - Upload file ke presigned URL
   - Confirm upload
   - Verify response dan file exists

2. **Test Invalid Project:**
   - Initiate upload dengan projectId yang tidak exists
   - Expect 404 error

3. **Test File Size Validation:**
   - Initiate upload dengan fileSize > 5MB
   - Expect 400 validation error

4. **Test Confirm Without Upload:**
   - Initiate upload
   - Langsung confirm tanpa upload ke S3
   - Expect 400 error dan record deleted

5. **Test Expired URL:**
   - Initiate upload
   - Wait > 1 hour
   - Try upload to presigned URL
   - Expect S3 error
   - Get new presigned URL

---

## Database Schema

```prisma
model ProjectImage {
  id         Int      @id @default(autoincrement())
  projectId  Int
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fileName   String
  fileType   String
  fileSize   Int
  imageUrl   String   // Full public URL
  key        String   // S3 object key
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## Related Files

- **Service**: `src/domains/project/project.service.ts`
  - `uploadProjectImage()`: Generate presigned URL
  - `confirmProjectImageUpload()`: Verify and confirm upload
  - `cleanupOrphanProjectImages()`: Cleanup orphan files (called by cron)

- **Scheduler**: `src/domains/project/project.scheduler.ts`
  - Cron job runs every day at 4 AM
  - Automatically cleanup orphan images

- **Controller**: `src/domains/project/project.controller.ts`
  - `POST /projects/:projectId/images/upload`
  - `POST /projects/:projectId/images/:imageId/confirm`

- **DTO**: `src/domains/project/dtos/upload-project-image.dto.ts`
  - Validation untuk fileName, fileType, fileSize

- **S3 Service**: `src/infrastructure/s3/s3.service.ts`
  - `generatePresignedUploadUrl()`: Generate presigned URL
  - `fileExists()`: Verify file in S3
  - `deleteFileByKey()`: Delete file from S3
