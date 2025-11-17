# Avatar Management Implementation

## Overview

Sistem avatar menggunakan tabel terpisah `AvatarImage` dengan soft delete untuk tracking dan cleanup orphaned files, mirip dengan implementasi `ProjectImage`.

## Database Schema

```prisma
model User {
  id            Int       @id @default(autoincrement())
  name          String
  username      String    @unique
  password      String
  avatarImageId String?   @unique
  role          Role      @default(USER)
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  avatarImage AvatarImage? @relation(fields: [avatarImageId], references: [key], onDelete: SetNull)
}

model AvatarImage {
  id        Int       @id @default(autoincrement())
  key       String    @unique
  deletedAt DateTime?
  createdAt DateTime  @default(now())

  users User?
}
```

## Features

### 1. **Soft Delete**

- Avatar tidak langsung dihapus dari S3
- Ditandai dengan `deletedAt` timestamp
- Cleanup dilakukan oleh cronjob

### 2. **Orphan Detection**

- Avatar yang sudah ditandai deleted akan dihapus otomatis
- Cronjob berjalan setiap hari jam 3 pagi
- Menghapus dari S3 dan database

### 3. **Automatic Avatar Generation**

- Saat user signup, otomatis generate Gravatar
- Upload ke S3 dengan key unik
- Fallback jika upload gagal (soft delete avatar)

## Implementation Details

### Create User with Avatar

```typescript
const user = await this.prisma.user.create({
  data: {
    username: data.username,
    password: hashedPassword,
    name: data.name,
    avatarImage: {
      create: {
        key: avatarKey,
      },
    },
  },
  include: {
    avatarImage: true,
  },
});
```

**Flow:**

1. Generate unique avatar key
2. Create user dengan avatar image record
3. Upload Gravatar ke S3
4. Jika upload gagal, mark avatar sebagai deleted

### Update Avatar

```typescript
// Mark old avatar as deleted
await this.prisma.avatarImage.update({
  where: { key: user.avatarImageId },
  data: { deletedAt: new Date() },
});

// Create new avatar record
const avatarImage = await this.prisma.avatarImage.create({
  data: { key: newAvatarKey },
});

// Update user reference
await this.prisma.user.update({
  where: { id: userId },
  data: { avatarImageId: avatarImage.key },
});
```

**Flow:**

1. Soft delete old avatar
2. Create new avatar record
3. Update user reference
4. Upload file ke S3
5. Jika gagal, mark new avatar sebagai deleted

### Delete Avatar

```typescript
// Soft delete avatar
await this.prisma.avatarImage.update({
  where: { key: user.avatarImageId },
  data: { deletedAt: new Date() },
});

// Remove reference from user
await this.prisma.user.update({
  where: { id: userId },
  data: { avatarImageId: null },
});
```

### Cleanup Deleted Avatars (Cronjob)

```typescript
const deletedAvatars = await this.prisma.avatarImage.findMany({
  where: {
    deletedAt: { not: null },
  },
});

for (const avatar of deletedAvatars) {
  // Delete from S3
  await this.s3Service.deleteFileByKey(avatar.key);

  // Delete from database
  await this.prisma.avatarImage.delete({
    where: { id: avatar.id },
  });
}
```

**Schedule:** Setiap hari jam 3 pagi (`CronExpression.EVERY_DAY_AT_3AM`)

## Methods

### User Service

**`create(data)`**

- Create user dengan auto-generated Gravatar
- Upload avatar ke S3
- Fallback jika upload gagal

**`updateAvatar(userId, file?)`**

- Update avatar dengan custom file atau regenerate Gravatar
- Soft delete old avatar
- Upload new avatar ke S3

**`deleteAvatar(userId)`**

- Soft delete avatar
- Remove reference dari user

**`cleanupDeletedAvatars()`**

- Delete orphaned avatars dari S3 dan database
- Called by cronjob

**`getAvatarUrl(userId)`**

- Get avatar URL by user ID
- Build S3 URL from key
- Return null jika tidak ada atau deleted

## Scheduler

```typescript
@Injectable()
export class UserScheduler {
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanupDeletedAvatars() {
    const result = await this.userService.cleanupDeletedAvatars();
    // Log results
  }
}
```

## Benefits

### 1. **Data Integrity**

- Avatar tracked di database
- Tidak ada orphaned files
- Easy to audit dan monitor

### 2. **Cost Optimization**

- Old avatars dihapus otomatis
- Tidak waste storage di S3
- Cleanup berjalan otomatis

### 3. **Recovery Option**

- Soft delete allows recovery
- Can restore before cronjob runs
- Grace period untuk undo

### 4. **Scalability**

- Efficient cleanup dengan batch processing
- Non-blocking operations
- Can handle large volumes

## Comparison with ProjectImage

| Feature          | AvatarImage   | ProjectImage   |
| ---------------- | ------------- | -------------- |
| Soft Delete      | ✅ deletedAt  | ❌ isUsed flag |
| Relation         | One-to-One    | One-to-Many    |
| Primary Flag     | ❌ Not needed | ✅ isPrimary   |
| Cleanup Schedule | 3 AM daily    | 2 AM daily     |
| Auto Generation  | ✅ Gravatar   | ❌ Manual      |
| File Type        | Images only   | Images only    |

## Error Handling

### Upload Failed

```typescript
try {
  await this.generateAndUploadAvatar(userId, avatarKey);
} catch (error) {
  // Mark avatar as deleted
  await this.prisma.avatarImage.update({
    where: { key: avatarKey },
    data: { deletedAt: new Date() },
  });
}
```

### Cleanup Failed

```typescript
try {
  await this.s3Service.deleteFileByKey(avatar.key);
  await this.prisma.avatarImage.delete({ where: { id: avatar.id } });
} catch (error) {
  // Log error and continue
  this.logger.error(`Failed to delete avatar: ${error.message}`);
}
```

## Usage Examples

### Get User with Avatar

```typescript
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  include: { avatarImage: true },
});

const avatarUrl =
  user.avatarImage && !user.avatarImage.deletedAt
    ? this.s3Service.getPublicUrl(user.avatarImage.key)
    : null;
```

### Update Avatar with Custom File

```typescript
const avatarUrl = await userService.updateAvatar(userId, file);
```

### Regenerate from Gravatar

```typescript
const avatarUrl = await userService.updateAvatar(userId);
```

### Delete Avatar

```typescript
await userService.deleteAvatar(userId);
```

### Manual Cleanup Trigger

```typescript
const result = await userService.cleanupDeletedAvatars();
console.log(`Deleted ${result.deleted} avatars`);
```

## Best Practices

1. ✅ Always use soft delete instead of hard delete
2. ✅ Verify file exists before confirming upload
3. ✅ Log all cleanup operations
4. ✅ Handle upload failures gracefully
5. ✅ Use unique keys with timestamp
6. ✅ Include user ID in avatar key for traceability
7. ✅ Monitor cleanup job results
8. ✅ Set appropriate cronjob schedule

## Monitoring

### Check Deleted Avatars Count

```sql
SELECT COUNT(*) FROM "AvatarImage" WHERE "deletedAt" IS NOT NULL;
```

### Find Old Deleted Avatars

```sql
SELECT * FROM "AvatarImage"
WHERE "deletedAt" IS NOT NULL
AND "deletedAt" < NOW() - INTERVAL '7 days';
```

### Check Users Without Avatars

```sql
SELECT COUNT(*) FROM "User" WHERE "avatarImageId" IS NULL;
```

## Migration Notes

Jika migrate dari old schema (`image` field):

```typescript
// 1. Create AvatarImage records for existing users
const users = await prisma.user.findMany({
  where: { image: { not: null } },
});

for (const user of users) {
  const key = extractKeyFromUrl(user.image);

  const avatar = await prisma.avatarImage.create({
    data: { key },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarImageId: avatar.key },
  });
}

// 2. Remove old image field (via migration)
```

## Troubleshooting

### Avatar Not Showing

1. Check if avatarImageId exists on user
2. Verify avatar record not deleted
3. Confirm file exists in S3
4. Check S3 URL generation

### Cleanup Not Running

1. Verify ScheduleModule imported in app.module
2. Check UserScheduler registered in providers
3. Review cronjob logs
4. Confirm timezone settings

### Upload Failures

1. Check S3 credentials
2. Verify network connectivity
3. Confirm Gravatar accessible
4. Check file size limits
