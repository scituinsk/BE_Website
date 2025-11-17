# Project API Documentation

## Overview

API endpoint untuk manajemen project dengan integrasi S3 untuk upload dan manajemen gambar. Termasuk cronjob otomatis untuk membersihkan gambar yang tidak terpakai.

## Endpoints

### 1. Create Project

**POST** `/projects`

**Auth Required:** Yes (ADMIN only)

**Request Body:**

```json
{
  "title": "Project Title",
  "description": "Short description",
  "about": "Detailed about section (optional)",
  "slug": "project-slug",
  "environment": "PRODUCTION", // or "BETA_TESTING"
  "duration": 6, // in months (optional)
  "launchDate": "2024-01-15", // ISO date (optional)
  "linkDemo": "https://demo.example.com", // optional
  "technologyIds": [1, 2, 3],
  "keyFeatures": ["Feature 1", "Feature 2"], // optional
  "challenges": ["Challenge 1", "Challenge 2"], // optional
  "results": ["Result 1", "Result 2"] // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": 1,
    "title": "Project Title",
    "slug": "project-slug",
    "environment": "PRODUCTION",
    "technologies": [...],
    "keyFeatures": [...],
    "challenges": [...],
    "results": [...]
  }
}
```

---

### 2. Get All Projects

**GET** `/projects`

**Auth Required:** No

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `environment` (optional): Filter by environment (PRODUCTION | BETA_TESTING)
- `search` (optional): Search in title and description

**Example:** `/projects?page=1&limit=10&environment=PRODUCTION&search=mobile`

**Response:**

```json
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "title": "Project Title",
        "description": "Description",
        "slug": "project-slug",
        "environment": "PRODUCTION",
        "technologies": [...],
        "primaryImage": "https://s3.../primary-image.jpg",
        "images": ["https://s3.../image1.jpg", "https://s3.../image2.jpg"]
      }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

### 3. Get Project by Slug

**GET** `/projects/:slug`

**Auth Required:** No

**Example:** `/projects/my-awesome-project`

**Response:**

```json
{
  "success": true,
  "message": "Project fetched successfully",
  "data": {
    "id": 1,
    "title": "Project Title",
    "description": "Description",
    "about": "Detailed about section",
    "slug": "project-slug",
    "environment": "PRODUCTION",
    "duration": 6,
    "launchDate": "2024-01-15T00:00:00.000Z",
    "linkDemo": "https://demo.example.com",
    "technologies": [
      {
        "id": 1,
        "name": "React",
        "logoUrl": "https://..."
      }
    ],
    "keyFeatures": [{ "id": 1, "feature": "Feature 1" }],
    "challenges": [{ "id": 1, "challenge": "Challenge 1" }],
    "results": [{ "id": 1, "result": "Result 1" }],
    "primaryImage": "https://s3.../primary-image.jpg",
    "images": ["https://s3.../image1.jpg"]
  }
}
```

---

### 4. Update Project

**PATCH** `/projects/:id`

**Auth Required:** Yes (ADMIN only)

**Request Body:** Same as Create Project (all fields optional)

**Response:**

```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": { ... }
}
```

---

### 5. Delete Project

**DELETE** `/projects/:id`

**Auth Required:** Yes (ADMIN only)

**Response:**

```json
{
  "success": true,
  "message": "Project deleted successfully",
  "data": { ... }
}
```

**Note:** Akan menghapus semua gambar terkait dari S3.

---

## Image Management Endpoints

### 6. Generate Presigned Upload URL (Recommended)

**POST** `/projects/:id/images/generate-upload-url`

**Auth Required:** Yes (ADMIN only)

**Request Body:**

```json
{
  "fileName": "my-image.jpg",
  "contentType": "image/jpeg",
  "isPrimary": true // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Presigned URL generated successfully",
  "data": {
    "uploadUrl": "https://s3.../presigned-url-with-signature",
    "fileUrl": "https://s3.../projects/1/1234567890-my-image.jpg",
    "key": "projects/1/1234567890-my-image.jpg",
    "expiresIn": 3600
  }
}
```

**Frontend Usage:**

```javascript
// Step 1: Request presigned URL
const response = await fetch('/api/projects/1/images/generate-upload-url', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileName: file.name,
    contentType: file.type,
    isPrimary: true,
  }),
});

const { uploadUrl, fileUrl, key } = await response.json();

// Step 2: Upload directly to S3 (no backend involved)
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
});

// Step 3: Confirm upload to save in database
await fetch('/api/projects/1/images/confirm-upload', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrl: fileUrl,
    key: key,
    isPrimary: true,
  }),
});
```

---

### 7. Confirm Upload

**POST** `/projects/:id/images/confirm-upload`

**Auth Required:** Yes (ADMIN only)

**Request Body:**

```json
{
  "imageUrl": "https://s3.../projects/1/1234567890-image.jpg",
  "key": "projects/1/1234567890-image.jpg",
  "isPrimary": true // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Upload confirmed successfully",
  "data": {
    "id": 1,
    "projectId": 1,
    "imageUrl": "https://s3.../image.jpg",
    "isPrimary": true,
    "isUsed": true
  }
}
```

---

### 8. Upload Image (Direct Upload - Legacy)

**POST** `/projects/:id/images`

**Auth Required:** Yes (ADMIN only)

**Content-Type:** `multipart/form-data`

**Form Fields:**

- `image`: File (required) - JPG, JPEG, PNG, GIF, or WEBP (max 5MB)
- `isPrimary`: Boolean (optional) - Set as primary image

**Note:** Metode ini masih didukung untuk backward compatibility, tapi presigned URL lebih direkomendasikan untuk production.

**Example using cURL:**

```bash
curl -X POST http://localhost:3000/projects/1/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "isPrimary=true"
```

**Response:**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "id": 1,
    "projectId": 1,
    "imageUrl": "https://s3.../projects/1/1234567890-image.jpg",
    "isPrimary": true,
    "isUsed": true,
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
}
```

---

### 9. Get Project Images

**GET** `/projects/:id/images`

**Auth Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Images fetched successfully",
  "data": [
    {
      "id": 1,
      "projectId": 1,
      "imageUrl": "https://s3.../image.jpg",
      "isPrimary": true,
      "isUsed": true,
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

---

### 10. Update Image

**PATCH** `/projects/images/:imageId`

**Auth Required:** Yes (ADMIN only)

**Request Body:**

```json
{
  "isPrimary": true, // optional
  "isUsed": false // optional - set false to mark for deletion
}
```

**Response:**

```json
{
  "success": true,
  "message": "Image updated successfully",
  "data": { ... }
}
```

**Note:** Jika `isUsed` diset ke `false`, gambar akan ditandai untuk dihapus oleh cronjob.

---

### 11. Delete Image

**DELETE** `/projects/images/:imageId`

**Auth Required:** Yes (ADMIN only)

**Response:**

```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": null
}
```

**Note:** Menghapus gambar langsung dari S3 dan database.

---

## Automated Image Cleanup

### Cronjob Schedule

- **Frequency:** Setiap hari pukul 2 pagi (configurable)
- **Function:** Menghapus gambar yang ditandai dengan `isUsed = false`
- **Location:** `src/domains/project/project.scheduler.ts`

### How It Works

1. Cronjob berjalan otomatis sesuai schedule
2. Mencari semua gambar dengan `isUsed = false`
3. Menghapus gambar dari S3
4. Menghapus record dari database
5. Log hasil cleanup

### Mengubah Schedule

Edit file `project.scheduler.ts`:

```typescript
// Opsi schedule:
@Cron(CronExpression.EVERY_DAY_AT_2AM)        // Setiap hari jam 2 pagi
@Cron('0 3 * * 0')                            // Setiap Minggu jam 3 pagi
@Cron('0 0 1 * *')                            // Setiap tanggal 1 jam 12 malam
@Cron('0 */6 * * *')                          // Setiap 6 jam
```

---

## Workflow Penggunaan

### Skenario 1: Upload Gambar dengan Presigned URL (Recommended)

1. **Request Presigned URL**

   ```
   POST /projects/1/images/generate-upload-url
   Body: { fileName: "photo.jpg", contentType: "image/jpeg", isPrimary: true }
   ```

2. **Upload ke S3 Langsung dari Frontend**

   ```javascript
   await fetch(presignedUrl, {
     method: 'PUT',
     body: file,
     headers: { 'Content-Type': file.type },
   });
   ```

3. **Confirm Upload**
   ```
   POST /projects/1/images/confirm-upload
   Body: { imageUrl, key, isPrimary: true }
   ```

**Keuntungan:**

- ✅ Upload langsung ke S3, tidak melalui backend
- ✅ Lebih cepat dan scalable
- ✅ Mengurangi beban server backend
- ✅ Progress tracking lebih mudah di frontend
- ✅ Timeout lebih fleksibel

### Skenario 2: Upload Gambar Direct (Legacy)

1. **Create Project**

   ```
   POST /projects
   ```

2. **Upload Primary Image**

   ```
   POST /projects/1/images
   Form data: image=file, isPrimary=true
   ```

3. **Upload Additional Images**
   ```
   POST /projects/1/images
   Form data: image=file
   ```

### Skenario 3: Mengganti Gambar

1. **Mark Old Image as Unused** (akan dihapus otomatis oleh cronjob)

   ```
   PATCH /projects/images/1
   Body: { "isUsed": false }
   ```

2. **Upload New Image dengan Presigned URL**
   ```
   POST /projects/1/images/generate-upload-url
   Upload to S3
   POST /projects/1/images/confirm-upload
   ```

### Skenario 4: Delete Project

```
DELETE /projects/1
```

Semua gambar terkait akan langsung dihapus dari S3.

---

## Environment Variables Required

```env
S3_ENDPOINT=your-s3-endpoint
S3_REGION=your-region
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "One or more technology IDs are invalid"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Project not found"
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "Project with this slug already exists"
}
```

### 422 Unprocessable Entity

```json
{
  "success": false,
  "message": "File type not allowed or file too large"
}
```

---

## Frontend Integration Tips

### 1. Upload Image dengan Presigned URL (Recommended)

```typescript
const uploadImageWithPresignedUrl = async (
  projectId: number,
  file: File,
  isPrimary: boolean,
  token: string,
) => {
  // Step 1: Get presigned URL
  const urlResponse = await fetch(
    `/api/projects/${projectId}/images/generate-upload-url`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        isPrimary,
      }),
    },
  );

  const { uploadUrl, fileUrl, key } = await urlResponse.json();

  // Step 2: Upload directly to S3 with progress tracking
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        console.log(`Upload progress: ${percentComplete}%`);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });

  // Step 3: Confirm upload
  const confirmResponse = await fetch(
    `/api/projects/${projectId}/images/confirm-upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: fileUrl,
        key,
        isPrimary,
      }),
    },
  );

  return confirmResponse.json();
};
```

### 2. Upload Image Direct (Legacy)

```typescript
const uploadImage = async (
  projectId: number,
  file: File,
  isPrimary: boolean,
) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('isPrimary', isPrimary.toString());

  const response = await fetch(`/api/projects/${projectId}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};
```

### 3. Pagination

```typescript
const getProjects = async (page: number, limit: number) => {
  const response = await fetch(`/api/projects?page=${page}&limit=${limit}`);
  const data = await response.json();

  return {
    projects: data.data.data,
    totalPages: data.data.meta.totalPages,
  };
};
```

### 4. Filter by Environment

```typescript
const getProductionProjects = async () => {
  const response = await fetch('/api/projects?environment=PRODUCTION');
  return response.json();
};
```

---

## Database Schema Notes

- `ProjectImage.isPrimary`: Hanya satu gambar per project yang bisa jadi primary
- `ProjectImage.isUsed`: Gambar dengan `false` akan dihapus oleh cronjob
- Relasi cascade delete: Menghapus project akan otomatis hapus semua relasi

---

## Testing

### Test Upload Image with Presigned URL

```bash
# Step 1: Generate presigned URL
curl -X POST http://localhost:3000/projects/1/images/generate-upload-url \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "contentType": "image/jpeg",
    "isPrimary": true
  }'

# Response will contain uploadUrl, fileUrl, and key

# Step 2: Upload to S3 using the presigned URL
curl -X PUT "PRESIGNED_URL_FROM_STEP_1" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@test.jpg"

# Step 3: Confirm upload
curl -X POST http://localhost:3000/projects/1/images/confirm-upload \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "FILE_URL_FROM_STEP_1",
    "key": "KEY_FROM_STEP_1",
    "isPrimary": true
  }'
```

### Test Upload Image Direct (Legacy)

```bash
# Upload as primary
curl -X POST http://localhost:3000/projects/1/images \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@test.jpg" \
  -F "isPrimary=true"

# Upload as regular image
curl -X POST http://localhost:3000/projects/1/images \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@test2.jpg"
```

### Test Get Projects with Filter

```bash
curl "http://localhost:3000/projects?environment=PRODUCTION&page=1&limit=5"
```
