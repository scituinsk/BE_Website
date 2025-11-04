# Architecture Diagram - Session Management

## Database Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        User Table                           │
├─────────────┬───────────────┬──────────────┬────────────────┤
│ id (PK)     │ username      │ password     │ image          │
│ name        │ role          │ createdAt    │ updatedAt      │
└─────────────┴───────────────┴──────────────┴────────────────┘
       │
       │ One-to-Many (1:N)
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Session Table                          │
├─────────────┬───────────────┬──────────────┬────────────────┤
│ id (PK)     │ userId (FK)   │ refreshToken │ deviceInfo     │
│ ipAddress   │ expiresAt     │ createdAt    │ updatedAt      │
└─────────────┴───────────────┴──────────────┴────────────────┘
```

## Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /auth/signin
     │    { username, password }
     │
     ▼
┌─────────────────────────────────────────┐
│         AuthController                  │
│  - Capture device info (User-Agent)     │
│  - Capture IP address                   │
└─────┬───────────────────────────────────┘
      │
      │ 2. Validate credentials
      │
      ▼
┌─────────────────────────────────────────┐
│          AuthService                    │
│  - Validate user                        │
│  - Generate JWT tokens                  │
└─────┬───────────────────────────────────┘
      │
      │ 3. Create session
      │
      ▼
┌─────────────────────────────────────────┐
│        SessionService                   │
│  - Hash refresh token                   │
│  - Store in database with:              │
│    • userId                             │
│    • refreshToken (hashed)              │
│    • deviceInfo                         │
│    • ipAddress                          │
│    • expiresAt                          │
└─────┬───────────────────────────────────┘
      │
      │ 4. Return tokens + user data
      │
      ▼
┌──────────┐
│  Client  │
│  Receives:                              │
│  - accessToken                          │
│  - refreshToken                         │
│  - user { id, name, image, role }       │
└──────────┘
```

## Multiple Sessions Example

```
User: John Doe (ID: 1)

Session 1:
┌─────────────────────────────────────────┐
│ Device: Chrome on Windows               │
│ IP: 192.168.1.100                       │
│ Created: 2025-11-01 09:00               │
│ Expires: 2025-11-08 09:00               │
└─────────────────────────────────────────┘

Session 2:
┌─────────────────────────────────────────┐
│ Device: Safari on iPhone                │
│ IP: 192.168.1.150                       │
│ Created: 2025-11-02 14:30               │
│ Expires: 2025-11-09 14:30               │
└─────────────────────────────────────────┘

Session 3:
┌─────────────────────────────────────────┐
│ Device: Firefox on Ubuntu               │
│ IP: 192.168.1.120                       │
│ Created: 2025-11-03 20:15               │
│ Expires: 2025-11-10 20:15               │
└─────────────────────────────────────────┘

Actions:
- POST /auth/logout → Deletes current session only
- POST /auth/logout-all → Deletes ALL 3 sessions
```

## Gravatar URL Generation

```
User ID: 1

   │
   │ MD5 Hash
   ▼

"c4ca4238a0b923820dcc509a6f75849b"

   │
   │ Build URL
   ▼

https://www.gravatar.com/avatar/c4ca4238a0b923820dcc509a6f75849b?s=500&d=retro&r=g

   │
   │ Store in User.image
   ▼

{
  "id": 1,
  "name": "John Doe",
  "image": "https://www.gravatar.com/avatar/...?s=500&d=retro&r=g"
}
```

## Refresh Token Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /auth/refresh
     │    Cookie: refreshToken=xyz
     │
     ▼
┌─────────────────────────────────────────┐
│      JwtRefreshAuthGuard                │
│  - Extract refresh token from cookie    │
│  - Validate JWT signature               │
└─────┬───────────────────────────────────┘
      │
      │ 2. Find session
      │
      ▼
┌─────────────────────────────────────────┐
│        SessionService                   │
│  - Find session by token (bcrypt)       │
│  - Check expiration                     │
└─────┬───────────────────────────────────┘
      │
      │ 3. Generate new tokens
      │
      ▼
┌─────────────────────────────────────────┐
│          AuthService                    │
│  - Generate new access token            │
│  - Generate new refresh token           │
└─────┬───────────────────────────────────┘
      │
      │ 4. Update session
      │
      ▼
┌─────────────────────────────────────────┐
│        SessionService                   │
│  - Update refreshToken in DB            │
│  - Update expiresAt                     │
└─────┬───────────────────────────────────┘
      │
      │ 5. Return new tokens
      │
      ▼
┌──────────┐
│  Client  │
│  Updated tokens in cookies              │
└──────────┘
```

## Session Cleanup Process

```
┌─────────────────────────────────────────┐
│      Cron Job (Daily 3 AM)              │
│      SessionScheduler                   │
└─────┬───────────────────────────────────┘
      │
      │ 1. Find expired sessions
      │
      ▼
┌─────────────────────────────────────────┐
│        SessionService                   │
│  SELECT * FROM Session                  │
│  WHERE expiresAt < NOW()                │
└─────┬───────────────────────────────────┘
      │
      │ 2. Delete expired sessions
      │
      ▼
┌─────────────────────────────────────────┐
│         Database                        │
│  DELETE FROM Session                    │
│  WHERE expiresAt < NOW()                │
└─────────────────────────────────────────┘
      │
      │ 3. Log result
      │
      ▼
┌─────────────────────────────────────────┐
│  Logger: "Cleaned up X sessions"        │
└─────────────────────────────────────────┘
```

## File Structure

```
src/
├── domains/
│   ├── auth/
│   │   ├── auth.controller.ts       ← Updated (device tracking)
│   │   ├── auth.service.ts          ← Updated (multi-session)
│   │   ├── auth.module.ts           ← Updated (SessionService)
│   │   ├── session.service.ts       ← NEW (session management)
│   │   ├── session.scheduler.ts     ← NEW (cleanup job)
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   └── decorators/
│   └── user/
│       └── user.service.ts          ← Updated (Gravatar)
│
├── common/
│   ├── constants/
│   └── utils/
│
└── infra/
    └── database/
        ├── prisma.service.ts
        └── prisma.module.ts

prisma/
├── schema.prisma                    ← Updated (Session model)
└── migrations/
    └── manual_add_session_model.sql ← NEW (manual migration)

docs/
├── SESSION_MANAGEMENT.md            ← NEW (documentation)
└── AUTH_API.md

IMPLEMENTATION_SUMMARY.md            ← NEW (summary)
```
