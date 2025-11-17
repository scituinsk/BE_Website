# Avatar Transaction Implementation

## Overview

Implementasi avatar menggunakan transaction pattern untuk memastikan data consistency antara S3 dan database. Jika salah satu operasi gagal, seluruh proses akan di-rollback.

## Transaction Flow

### Pattern: Upload First, Then Commit

```
1. Upload to S3 first
   ├─ Success → Continue to step 2
   └─ Fail → Throw error, stop process

2. Database Transaction
   ├─ Create/Update records
   ├─ Success → Commit
   └─ Fail → Rollback S3 upload
```

## Create User Flow

```typescript
// Step 1: Upload to S3 first (before DB transaction)
try {
  s3Url = await s3Service.uploadFromUrl(gravatarUrl, fileName, 'avatars');
} catch (error) {
  throw new Error('Failed to upload avatar. User creation cancelled.');
}

// Step 2: Database transaction
try {
  const user = await prisma.$transaction(async (tx) => {
    return await tx.user.create({
      data: {
        username,
        password,
        name,
        avatarImage: {
          create: { key: avatarKey, imageUrl: s3Url },
        },
      },
    });
  });
  return user;
} catch (error) {
  // Rollback S3 upload if DB fails
  await s3Service.deleteFileByKey(avatarKey);
  throw error;
}
```

**Benefits:**

- ✅ S3 upload terjadi SEBELUM user dibuat
- ✅ Jika S3 gagal, user tidak akan dibuat sama sekali
- ✅ Jika DB gagal, S3 file akan dihapus (rollback)
- ✅ Tidak ada orphaned records atau files

## Update Avatar Flow

```typescript
// Step 1: Upload new avatar to S3 first
try {
  s3Url = await uploadToS3(file);
} catch (error) {
  throw new Error('Failed to upload avatar');
}

// Step 2: Database transaction
try {
  await prisma.$transaction(async (tx) => {
    // Soft delete old avatar
    if (oldAvatarKey) {
      await tx.avatarImage.update({
        where: { key: oldAvatarKey },
        data: { deletedAt: new Date() },
      });
    }

    // Create new avatar record
    await tx.avatarImage.create({
      data: { key: newAvatarKey, imageUrl: s3Url },
    });

    // Update user reference
    await tx.user.update({
      where: { id: userId },
      data: { avatarImageId: newAvatarKey },
    });
  });

  return s3Url;
} catch (error) {
  // Rollback new S3 upload
  await s3Service.deleteFileByKey(newAvatarKey);
  throw error;
}
```

**Benefits:**

- ✅ Old avatar tetap ada jika update gagal
- ✅ New avatar di-upload dulu sebelum DB update
- ✅ Jika DB gagal, new avatar dihapus dari S3
- ✅ User tidak pernah dalam state "tanpa avatar"

## Error Scenarios & Handling

### Scenario 1: S3 Upload Fails (Create User)

```
Upload to S3 → ❌ FAILS
└─ User creation stopped
   └─ No database records created
   └─ No cleanup needed
```

**Impact:** User registration gagal, user diminta retry

### Scenario 2: Database Transaction Fails (Create User)

```
Upload to S3 → ✅ SUCCESS
Database Transaction → ❌ FAILS
└─ Rollback: Delete file from S3
   └─ No orphaned files
   └─ No database records
```

**Impact:** User registration gagal, S3 file dihapus otomatis

### Scenario 3: Rollback Fails

```
Upload to S3 → ✅ SUCCESS
Database Transaction → ❌ FAILS
Rollback S3 → ❌ FAILS
└─ Log error for manual cleanup
   └─ File marked for cronjob cleanup
```

**Impact:** Orphaned file akan dibersihkan oleh cronjob

### Scenario 4: S3 Upload Fails (Update Avatar)

```
Upload new avatar to S3 → ❌ FAILS
└─ Update stopped
   └─ Old avatar tetap aktif
   └─ No database changes
```

**Impact:** Avatar update gagal, user tetap pakai avatar lama

### Scenario 5: Database Transaction Fails (Update Avatar)

```
Upload new avatar to S3 → ✅ SUCCESS
Database Transaction → ❌ FAILS
└─ Rollback: Delete new file from S3
   └─ Old avatar tetap aktif
   └─ No database changes
```

**Impact:** Avatar update gagal, new file dihapus, old avatar tetap

## Database Schema

```prisma
model AvatarImage {
  id        Int       @id @default(autoincrement())
  key       String    @unique
  imageUrl  String?   // S3 URL stored for easy serving
  deletedAt DateTime? // Soft delete for cleanup
  createdAt DateTime  @default(now())

  users User?
}
```

**Why `imageUrl` field?**

- ✅ Direct access tanpa perlu build URL
- ✅ Faster query response (no computation)
- ✅ Easy to serve to frontend
- ✅ Can track actual S3 URLs

## Benefits of This Pattern

### 1. **Data Consistency**

- Upload first ensures file exists before DB commit
- Transaction ensures atomic DB operations
- Rollback prevents orphaned files

### 2. **Failure Recovery**

- Each failure point has defined handling
- Automatic cleanup on transaction failure
- Cronjob as final safety net

### 3. **User Experience**

- Clear error messages
- No partial states
- Old data preserved on failure

### 4. **Auditability**

- All operations logged
- Can trace failure points
- Easy to debug issues

## Comparison: Before vs After

### Before (No Transaction)

```typescript
// ❌ Creates user first, then upload
const user = await prisma.user.create({...});

try {
  await uploadToS3();
} catch (error) {
  // User already created!
  // Need to soft delete avatar
  await prisma.avatarImage.update({
    data: { deletedAt: new Date() }
  });
}
```

**Problems:**

- User created even if S3 fails
- Orphaned database records
- Complex error handling

### After (With Transaction)

```typescript
// ✅ Upload first, then create user
const s3Url = await uploadToS3(); // Fail fast

await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({...});
});
```

**Benefits:**

- No user if S3 fails
- Clean error handling
- No orphaned records

## Implementation Checklist

- [✅] Upload to S3 before database transaction
- [✅] Use Prisma transaction for DB operations
- [✅] Rollback S3 on transaction failure
- [✅] Log all operations and errors
- [✅] Store imageUrl in database
- [✅] Soft delete old avatars
- [✅] Cronjob cleanup for safety net

## Testing Scenarios

### Test 1: Normal Flow

```typescript
// Should succeed
const user = await userService.create({
  name: 'Test User',
  username: 'test@example.com',
  password: 'password123',
});

expect(user.avatarImage).toBeDefined();
expect(user.avatarImage.imageUrl).toContain('s3');
```

### Test 2: S3 Failure

```typescript
// Mock S3 to fail
jest.spyOn(s3Service, 'uploadFromUrl').mockRejectedValue(new Error('S3 Error'));

// Should throw and not create user
await expect(userService.create({...})).rejects.toThrow();

// Verify no user created
const user = await prisma.user.findUnique({...});
expect(user).toBeNull();
```

### Test 3: Database Failure

```typescript
// Mock transaction to fail
jest.spyOn(prisma, '$transaction').mockRejectedValue(new Error('DB Error'));

// Should throw and rollback S3
await expect(userService.create({...})).rejects.toThrow();

// Verify S3 delete was called
expect(s3Service.deleteFileByKey).toHaveBeenCalled();
```

## Migration Guide

### Step 1: Update Schema

```prisma
model AvatarImage {
  id        Int       @id @default(autoincrement())
  key       String    @unique
  imageUrl  String?   // Add this field
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  users User?
}
```

### Step 2: Generate Prisma Client

```bash
npx prisma db push
npx prisma generate
```

### Step 3: Migrate Existing Data

```typescript
// Optional: Backfill imageUrl for existing records
const avatars = await prisma.avatarImage.findMany({
  where: { imageUrl: null },
});

for (const avatar of avatars) {
  const url = s3Service.getPublicUrl(avatar.key);
  await prisma.avatarImage.update({
    where: { id: avatar.id },
    data: { imageUrl: url },
  });
}
```

## Monitoring

### Check Transaction Success Rate

```sql
-- Count users with avatars
SELECT COUNT(*) FROM "User"
WHERE "avatarImageId" IS NOT NULL;

-- Count avatars with URLs
SELECT COUNT(*) FROM "AvatarImage"
WHERE "imageUrl" IS NOT NULL;

-- Should be equal in production
```

### Check Orphaned Files

```sql
-- Files without imageUrl (incomplete uploads)
SELECT * FROM "AvatarImage"
WHERE "imageUrl" IS NULL
AND "deletedAt" IS NULL;
```

## Best Practices

1. ✅ **Upload before DB transaction** - Fail fast pattern
2. ✅ **Use Prisma transactions** - Atomic operations
3. ✅ **Always rollback on failure** - Clean up resources
4. ✅ **Log all operations** - Debugging and monitoring
5. ✅ **Store URLs in DB** - Performance optimization
6. ✅ **Soft delete old files** - Recovery option
7. ✅ **Cronjob cleanup** - Final safety net
8. ✅ **Handle rollback failures** - Graceful degradation

## Troubleshooting

### Issue: User created but no avatar

**Check:**

```sql
SELECT * FROM "User"
WHERE "avatarImageId" IS NULL;
```

**Cause:** S3 upload failed after user creation (should not happen with new pattern)

### Issue: Orphaned S3 files

**Check logs for:**

- Failed transaction rollbacks
- S3 delete errors

**Solution:** Run cleanup cronjob manually

### Issue: Transaction timeout

**Cause:** Large file upload taking too long

**Solution:**

- Increase transaction timeout
- Use presigned URL for large files
- Optimize image size before upload
