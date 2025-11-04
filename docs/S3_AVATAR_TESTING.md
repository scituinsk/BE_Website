# Testing S3 Avatar Implementation

## 🧪 Test Scenarios

### 1. Sign Up with Auto Avatar

```bash
# Sign up new user
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser@example.com",
    "password": "SecurePass123",
    "name": "Test User"
  }'

# Expected Response:
{
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "username": "testuser@example.com",
    "name": "Test User",
    "role": "USER",
    "image": "https://your-s3-endpoint.com/bucket/avatars/user-1-1730700000000.png"
  }
}
```

### 2. Sign In and Get Token

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser@example.com",
    "password": "SecurePass123"
  }'

# Save accessToken from response
```

### 3. Get Current User Profile

```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Response will include S3 image URL
```

### 4. Upload Custom Avatar

```bash
# Prepare image file first
# Then upload:
curl -X POST http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@./test-avatar.jpg"

# Expected Response:
{
  "statusCode": 200,
  "message": "Avatar updated successfully",
  "data": {
    "image": "https://your-s3-endpoint.com/bucket/avatars/user-1-1730700500000.jpg"
  }
}
```

### 5. Regenerate Avatar from Gravatar

```bash
# POST without file will regenerate from Gravatar
curl -X POST http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Old avatar deleted, new one generated from Gravatar
```

### 6. Delete Avatar

```bash
curl -X DELETE http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Response:
{
  "statusCode": 200,
  "message": "Avatar deleted successfully",
  "data": null
}
```

## 🔍 Manual Testing Checklist

### Pre-requisites

- [ ] S3 bucket created and configured
- [ ] Environment variables set correctly
- [ ] Application running (`npm run start:dev`)
- [ ] Database connected

### Test Cases

#### ✅ User Registration

- [ ] New user created successfully
- [ ] Avatar URL is S3 endpoint (not Gravatar)
- [ ] Image accessible via S3 URL
- [ ] File exists in S3 bucket under `avatars/` folder

#### ✅ Custom Avatar Upload

- [ ] Upload JPG file successfully
- [ ] Upload PNG file successfully
- [ ] Upload GIF file successfully
- [ ] Old avatar deleted from S3
- [ ] New avatar URL returned
- [ ] New avatar accessible

#### ✅ Avatar Regeneration

- [ ] Regenerate without file works
- [ ] New Gravatar image downloaded
- [ ] Uploaded to S3 successfully
- [ ] Old avatar cleaned up

#### ✅ Avatar Deletion

- [ ] Delete endpoint works
- [ ] File removed from S3
- [ ] User.image set to null
- [ ] No errors on subsequent calls

#### ✅ Error Handling

- [ ] Invalid token returns 401
- [ ] User not found returns 404
- [ ] S3 failure handled gracefully
- [ ] Gravatar download failure handled

## 🧪 Automated Tests (Jest)

```typescript
// user.service.spec.ts
describe('UserService - Avatar Management', () => {
  let service: UserService;
  let s3Service: S3Service;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: S3Service,
          useValue: {
            uploadFromUrl: jest.fn(),
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    s3Service = module.get<S3Service>(S3Service);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create user with S3 avatar', async () => {
      const userData = {
        username: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const createdUser = {
        id: 1,
        ...userData,
        password: 'hashed',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };

      const s3Url = 'https://s3.example.com/bucket/avatars/user-1.png';

      jest.spyOn(prisma.user, 'create').mockResolvedValue(createdUser);
      jest.spyOn(s3Service, 'uploadFromUrl').mockResolvedValue(s3Url);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...createdUser,
        image: s3Url,
      });

      const result = await service.create(userData);

      expect(result.image).toBe(s3Url);
      expect(s3Service.uploadFromUrl).toHaveBeenCalled();
    });

    it('should handle S3 upload failure gracefully', async () => {
      const userData = {
        username: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const createdUser = {
        id: 1,
        ...userData,
        password: 'hashed',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };

      jest.spyOn(prisma.user, 'create').mockResolvedValue(createdUser);
      jest
        .spyOn(s3Service, 'uploadFromUrl')
        .mockRejectedValue(new Error('S3 Error'));

      const result = await service.create(userData);

      expect(result.image).toBeNull();
    });
  });

  describe('updateAvatar', () => {
    it('should upload custom avatar', async () => {
      const userId = 1;
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const user = {
        id: userId,
        image: 'old-url.png',
      };

      const newUrl = 'https://s3.example.com/bucket/avatars/new.jpg';

      jest.spyOn(service, 'findById').mockResolvedValue(user as any);
      jest.spyOn(s3Service, 'deleteFile').mockResolvedValue(undefined);
      jest.spyOn(s3Service, 'uploadFile').mockResolvedValue(newUrl);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);

      const result = await service.updateAvatar(userId, file);

      expect(result).toBe(newUrl);
      expect(s3Service.deleteFile).toHaveBeenCalledWith(user.image);
      expect(s3Service.uploadFile).toHaveBeenCalled();
    });

    it('should regenerate from Gravatar when no file provided', async () => {
      const userId = 1;
      const user = { id: userId, image: 'old-url.png' };
      const newUrl = 'https://s3.example.com/bucket/avatars/regenerated.png';

      jest.spyOn(service, 'findById').mockResolvedValue(user as any);
      jest.spyOn(s3Service, 'deleteFile').mockResolvedValue(undefined);
      jest.spyOn(service, 'generateAndUploadAvatar').mockResolvedValue(newUrl);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);

      const result = await service.updateAvatar(userId);

      expect(result).toBe(newUrl);
      expect(service.generateAndUploadAvatar).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar from S3 and database', async () => {
      const userId = 1;
      const user = { id: userId, image: 's3-url.png' };

      jest.spyOn(service, 'findById').mockResolvedValue(user as any);
      jest.spyOn(s3Service, 'deleteFile').mockResolvedValue(undefined);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);

      await service.deleteAvatar(userId);

      expect(s3Service.deleteFile).toHaveBeenCalledWith(user.image);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { image: null },
      });
    });

    it('should handle user without avatar', async () => {
      const userId = 1;
      const user = { id: userId, image: null };

      jest.spyOn(service, 'findById').mockResolvedValue(user as any);
      jest.spyOn(s3Service, 'deleteFile').mockResolvedValue(undefined);

      await service.deleteAvatar(userId);

      expect(s3Service.deleteFile).not.toHaveBeenCalled();
    });
  });
});
```

## 🎯 Load Testing

```bash
# Install Apache Bench (if not installed)
# sudo apt-get install apache2-utils

# Test concurrent uploads
ab -n 100 -c 10 -p avatar.jpg -T image/jpeg \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/users/me/avatar
```

## 📊 Monitoring

### Logs to Check

```bash
# Application logs
tail -f logs/application.log | grep -i avatar

# Look for:
# - "Avatar uploaded to S3 for user X"
# - "Successfully uploaded X from Y to S3"
# - "Failed to upload avatar for user X"
# - "Failed to delete old avatar"
```

### S3 Bucket Check

```bash
# List files in avatars folder
aws s3 ls s3://your-bucket/avatars/

# Check file size
aws s3 ls s3://your-bucket/avatars/ --human-readable

# Count files
aws s3 ls s3://your-bucket/avatars/ | wc -l
```

## ✅ Success Criteria

1. **User Creation**
   - ✅ User created with S3 avatar URL
   - ✅ File exists in S3 bucket
   - ✅ Image is accessible via URL

2. **Custom Upload**
   - ✅ Old file deleted from S3
   - ✅ New file uploaded successfully
   - ✅ Database updated with new URL

3. **Regeneration**
   - ✅ Gravatar downloaded
   - ✅ Uploaded to S3
   - ✅ Old file cleaned up

4. **Deletion**
   - ✅ File removed from S3
   - ✅ Database field set to null
   - ✅ No orphaned files

## 🐛 Common Issues

### Issue: "Failed to upload to S3"

**Solution:**

- Check S3 credentials
- Verify bucket exists
- Check network connectivity

### Issue: "Image not accessible"

**Solution:**

- Set bucket policy for public read
- Check CORS configuration
- Verify URL format

### Issue: "Old files not deleted"

**Solution:**

- Check S3 permissions for delete
- Verify URL parsing in `getKeyFromUrl()`
- Check logs for delete errors

---

**Ready to Test!** 🚀
