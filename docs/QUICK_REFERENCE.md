# Quick Reference - Session Management

## 🚀 Quick Start

### 1. Database Migration (When Online)

```bash
# Option 1: Automatic
npx prisma migrate dev --name add-session-model-and-user-image

# Option 2: Force push
npx prisma db push

# Option 3: Manual SQL
psql -d your_db < prisma/migrations/manual_add_session_model.sql
```

### 2. Test the API

```bash
# Sign up
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test@test.com","password":"pass123","name":"Test"}'

# Sign in
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"test@test.com","password":"pass123"}'

# Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer {token}"
```

## 📝 Code Examples

### Get User with Avatar

```typescript
const user = await this.userService.findById(userId);
console.log(user.image);
// https://www.gravatar.com/avatar/...?s=500&d=retro&r=g
```

### List User Sessions

```typescript
const sessions = await this.sessionService.findUserSessions(userId);
console.log(`User has ${sessions.length} active sessions`);
```

### Manual Cleanup

```typescript
await this.sessionService.cleanupExpiredSessions();
```

## 🔑 Environment Variables

Required in `.env`:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
NODE_ENV="development" # or "production"
```

## 📊 Database Queries

```sql
-- View all sessions
SELECT s.id, s.deviceInfo, s.ipAddress, s.expiresAt, u.username
FROM "Session" s
JOIN "User" u ON s.userId = u.id;

-- Count sessions per user
SELECT u.username, COUNT(s.id) as session_count
FROM "User" u
LEFT JOIN "Session" s ON u.id = s.userId
GROUP BY u.id, u.username;

-- Find expired sessions
SELECT * FROM "Session"
WHERE "expiresAt" < NOW();

-- Clean expired sessions manually
DELETE FROM "Session"
WHERE "expiresAt" < NOW();
```

## 🛠️ Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# View database in browser
npx prisma studio

# Format schema
npx prisma format

# Check migration status
npx prisma migrate status

# Build project
npm run build

# Run tests
npm run test
```

## 🔍 Debugging

### Check if session exists

```typescript
const session = await this.prisma.session.findFirst({
  where: { userId: 1 },
  include: { user: true },
});
console.log(session);
```

### Verify refresh token

```typescript
const isValid = await bcrypt.compare(plainToken, hashedToken);
```

### Generate Gravatar manually

```typescript
import * as crypto from 'crypto';

const userId = 1;
const hash = crypto.createHash('md5').update(userId.toString()).digest('hex');
const url = `https://www.gravatar.com/avatar/${hash}?s=500&d=retro&r=g`;
```

## 🎯 API Endpoints Cheatsheet

| Method | Endpoint           | Auth                   | Description            |
| ------ | ------------------ | ---------------------- | ---------------------- |
| POST   | `/auth/signup`     | No                     | Create account         |
| POST   | `/auth/signin`     | No                     | Login (create session) |
| POST   | `/auth/refresh`    | Refresh Token          | Get new tokens         |
| POST   | `/auth/logout`     | Access Token + Refresh | Logout current device  |
| POST   | `/auth/logout-all` | Access Token           | Logout all devices     |
| GET    | `/auth/session`    | Access Token           | Get current session    |

## ⚡ Performance Tips

1. **Index Usage**: Session queries use indexes on `userId` and `refreshToken`
2. **Cascade Delete**: Sessions auto-delete when user deleted
3. **Batch Cleanup**: Run cleanup job daily at low-traffic hours
4. **Gravatar CDN**: Images cached by Gravatar CDN

## 🔒 Security Checklist

- [x] Refresh tokens hashed with bcrypt
- [x] Session expiration enforced
- [x] Device & IP tracking enabled
- [x] Cascade delete on user removal
- [x] Unique constraint on refreshToken
- [x] HTTPS in production (secure cookies)

## 📦 Dependencies

Already installed:

- `@nestjs/common`
- `@nestjs/jwt`
- `@prisma/client`
- `bcrypt`

Optional:

```bash
npm install @nestjs/schedule  # For auto cleanup
```

## 🐛 Common Issues

### "Session not found"

- Session expired → User needs to login again
- Wrong refresh token → Validate token format
- Session deleted → User logged out

### "Cannot reach database"

- Check DATABASE_URL in .env
- Verify database is running
- Check network/firewall

### "Unique constraint failed"

- Duplicate refresh token (very rare)
- Retry login

## 📚 Documentation Links

- [Session Management Guide](./SESSION_MANAGEMENT.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)
- [Auth API Docs](./AUTH_API.md)
- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Auth](https://docs.nestjs.com/security/authentication)

## 💡 Pro Tips

1. **Multiple Gravatar Styles**: Change `d=retro` to `d=identicon`, `d=monsterid`, etc.
2. **Session Limits**: Add logic to limit max sessions per user
3. **Activity Tracking**: Add `lastActivityAt` to Session model
4. **Email Alerts**: Notify on new device login
5. **Suspicious Activity**: Flag rapid login/logout patterns

---

**Need Help?** Check [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)
