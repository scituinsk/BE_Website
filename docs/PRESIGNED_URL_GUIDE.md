# Presigned URL Upload Flow

## Overview

Presigned URL adalah cara yang lebih aman, cepat, dan scalable untuk upload file ke S3. Dengan metode ini, file di-upload langsung dari browser client ke S3, tanpa melalui backend server.

## Keuntungan Presigned URL

### 1. **Performance**

- Upload langsung ke S3, tidak ada bottleneck di backend
- Bandwidth server backend tidak terpakai untuk transfer file
- Lebih cepat karena koneksi langsung ke S3

### 2. **Scalability**

- Backend tidak perlu handle file transfer
- Dapat handle banyak concurrent upload tanpa membebani server
- Cocok untuk aplikasi dengan traffic tinggi

### 3. **Security**

- URL hanya valid untuk waktu terbatas (default 1 jam)
- URL hanya bisa digunakan untuk operasi spesifik (upload/download)
- Tidak perlu expose S3 credentials ke frontend

### 4. **User Experience**

- Progress tracking lebih akurat dan smooth
- Upload tidak terputus jika koneksi backend terputus
- Bisa retry upload tanpa request ulang ke backend

## Flow Diagram

```
Frontend                    Backend                     S3
   |                           |                         |
   |--1. Request Presigned---->|                         |
   |   URL dengan metadata     |                         |
   |                           |                         |
   |<--2. Return Presigned-----|                         |
   |    URL & file info        |                         |
   |                           |                         |
   |--3. Upload File Direct------------------->|
   |   menggunakan PUT request                 |
   |                           |               |
   |<--4. Upload Success-------------------|
   |                           |               |
   |--5. Confirm Upload------->|               |
   |   save metadata to DB     |               |
   |                           |--6. Verify--->|
   |                           |   file exists |
   |                           |<--7. OK-------|
   |                           |               |
   |<--8. Success Response-----|               |
   |   with saved metadata     |               |
```

## Implementation Details

### Step 1: Request Presigned URL

**Endpoint:** `POST /projects/:id/images/generate-upload-url`

**Request:**

```json
{
  "fileName": "product-image.jpg",
  "contentType": "image/jpeg",
  "isPrimary": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Presigned URL generated successfully",
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/path?X-Amz-Algorithm=...",
    "fileUrl": "https://s3.amazonaws.com/bucket/projects/1/1234567890-product-image.jpg",
    "key": "projects/1/1234567890-product-image.jpg",
    "expiresIn": 3600
  }
}
```

**Backend Process:**

1. Validate project exists
2. Validate content type (hanya accept image types)
3. Generate unique file key dengan timestamp
4. Create presigned URL dengan expiry time
5. Return URL dan metadata

### Step 2: Upload to S3

**Method:** PUT request ke `uploadUrl`

**Headers:**

```
Content-Type: image/jpeg (sesuai file type)
```

**Body:** Raw file binary data

**Frontend Implementation:**

```javascript
const uploadToS3 = async (presignedUrl, file) => {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error('Upload to S3 failed');
  }

  return response;
};
```

**With Progress Tracking:**

```javascript
const uploadWithProgress = (presignedUrl, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};
```

### Step 3: Confirm Upload

**Endpoint:** `POST /projects/:id/images/confirm-upload`

**Request:**

```json
{
  "imageUrl": "https://s3.amazonaws.com/bucket/projects/1/1234567890-product-image.jpg",
  "key": "projects/1/1234567890-product-image.jpg",
  "isPrimary": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Upload confirmed successfully",
  "data": {
    "id": 123,
    "projectId": 1,
    "imageUrl": "https://s3.amazonaws.com/...",
    "isPrimary": true,
    "isUsed": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Backend Process:**

1. Validate project exists
2. **Verify file exists in S3** (security check)
3. If isPrimary, unset other primary images
4. Save image record to database
5. Return saved record

## Complete Frontend Example

### React Component with Progress

```tsx
import { useState } from 'react';

function ImageUploader({ projectId, token }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleUpload = async (file: File, isPrimary: boolean) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

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

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { data } = await urlResponse.json();
      const { uploadUrl, fileUrl, key } = data;

      // Step 2: Upload to S3 with progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error('Upload to S3 failed'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

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

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      const result = await confirmResponse.json();
      console.log('Upload successful:', result);

      setProgress(100);
      setUploading(false);

      return result;
    } catch (err) {
      setError(err.message);
      setUploading(false);
      throw err;
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUpload(file, false);
          }
        }}
        disabled={uploading}
      />

      {uploading && (
        <div>
          <div>Uploading: {progress}%</div>
          <progress value={progress} max="100" />
        </div>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
```

### Vue 3 Composition API

```vue
<script setup>
import { ref } from 'vue';

const props = defineProps({
  projectId: Number,
  token: String,
});

const uploading = ref(false);
const progress = ref(0);
const error = ref(null);

const handleUpload = async (file, isPrimary = false) => {
  try {
    uploading.value = true;
    progress.value = 0;
    error.value = null;

    // Step 1: Get presigned URL
    const urlResponse = await fetch(
      `/api/projects/${props.projectId}/images/generate-upload-url`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${props.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPrimary,
        }),
      },
    );

    const { data } = await urlResponse.json();
    const { uploadUrl, fileUrl, key } = data;

    // Step 2: Upload to S3
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          progress.value = Math.round((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        xhr.status === 200 ? resolve() : reject(new Error('Upload failed'));
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    // Step 3: Confirm upload
    await fetch(`/api/projects/${props.projectId}/images/confirm-upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${props.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: fileUrl, key, isPrimary }),
    });

    progress.value = 100;
    uploading.value = false;
  } catch (err) {
    error.value = err.message;
    uploading.value = false;
  }
};

const onFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (file) handleUpload(file);
};
</script>

<template>
  <div>
    <input
      type="file"
      accept="image/*"
      @change="onFileSelect"
      :disabled="uploading"
    />

    <div v-if="uploading">
      <p>Uploading: {{ progress }}%</p>
      <progress :value="progress" max="100"></progress>
    </div>

    <div v-if="error" style="color: red">{{ error }}</div>
  </div>
</template>
```

## Error Handling

### Common Errors

**1. Presigned URL Expired**

```json
{
  "error": "Request has expired",
  "code": "AccessDenied"
}
```

**Solution:** Request new presigned URL

**2. Invalid Content Type**

```json
{
  "success": false,
  "message": "Invalid content type. Only images are allowed."
}
```

**Solution:** Ensure file type is one of: image/jpeg, image/jpg, image/png, image/gif, image/webp

**3. File Not Found in S3**

```json
{
  "success": false,
  "message": "File not found in S3. Upload may have failed."
}
```

**Solution:** Retry upload process from step 1

**4. Network Error During Upload**
**Solution:** Implement retry logic with exponential backoff

### Retry Logic Example

```javascript
const uploadWithRetry = async (presignedUrl, file, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await uploadToS3(presignedUrl, file);
      return; // Success
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error; // Last retry failed
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
```

## Security Considerations

### 1. URL Expiration

- Default: 1 hour (3600 seconds)
- Adjustable based on use case
- Expired URLs cannot be used

### 2. File Verification

- Backend verifies file exists in S3 before saving to database
- Prevents orphaned database records
- Ensures data integrity

### 3. Content Type Validation

- Only allowed image types accepted
- Validated in both generate URL and confirm steps
- Prevents malicious file uploads

### 4. Authentication

- All endpoints require authentication (except read operations)
- Admin role required for uploads
- Token validated on each request

## Performance Tips

### 1. Parallel Uploads

```javascript
const uploadMultipleImages = async (projectId, files) => {
  const uploads = files.map((file) =>
    uploadImageWithPresignedUrl(projectId, file, false, token),
  );

  return Promise.all(uploads);
};
```

### 2. Compression Before Upload

```javascript
const compressImage = async (file, maxWidth = 1920) => {
  // Use canvas or library like browser-image-compression
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: maxWidth,
    useWebWorker: true,
  };

  return await imageCompression(file, options);
};
```

### 3. Lazy Loading Images

```javascript
// Use intersection observer for lazy loading
const LazyImage = ({ src, alt }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setImageSrc(src);
  }, [src]);

  return <img src={imageSrc} alt={alt} />;
};
```

## Monitoring & Logging

Backend logs setiap step:

- Presigned URL generation
- Upload confirmation
- File verification
- Errors dan failures

Check logs untuk debugging:

```bash
# View logs
tail -f logs/application.log

# Search for upload errors
grep "Upload" logs/application.log | grep "error"
```

## Best Practices

1. ✅ Always validate file type before requesting presigned URL
2. ✅ Show progress indicator to user
3. ✅ Implement retry logic for network failures
4. ✅ Compress images before upload for better performance
5. ✅ Handle errors gracefully with user-friendly messages
6. ✅ Clean up unused images periodically (handled by cronjob)
7. ✅ Use presigned URL for production, direct upload for development
8. ✅ Set appropriate expiry time based on expected upload duration
9. ✅ Verify upload success before showing confirmation to user
10. ✅ Implement file size limits on frontend before upload

## Comparison: Presigned URL vs Direct Upload

| Feature           | Presigned URL        | Direct Upload     |
| ----------------- | -------------------- | ----------------- |
| Performance       | ⭐⭐⭐⭐⭐ Fast      | ⭐⭐⭐ Medium     |
| Scalability       | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good       |
| Backend Load      | ⭐⭐⭐⭐⭐ Minimal   | ⭐⭐ High         |
| Progress Tracking | ⭐⭐⭐⭐⭐ Accurate  | ⭐⭐⭐ Good       |
| Implementation    | ⭐⭐⭐ Complex       | ⭐⭐⭐⭐⭐ Simple |
| Security          | ⭐⭐⭐⭐⭐ High      | ⭐⭐⭐⭐ High     |
| Error Handling    | ⭐⭐⭐ Moderate      | ⭐⭐⭐⭐ Easy     |
| Recommended for   | Production           | Development       |

## Conclusion

Presigned URL adalah metode yang **highly recommended** untuk production environment karena:

- Lebih cepat dan scalable
- Mengurangi beban server backend
- Better user experience dengan progress tracking
- Tetap aman dengan expiry time dan validation

Direct upload masih tersedia untuk backward compatibility dan development, tapi untuk production sebaiknya gunakan presigned URL.
