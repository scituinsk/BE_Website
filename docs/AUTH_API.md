# Auth API Documentation

## Endpoints

### 1. Sign Up (Register)

**POST** `/auth/signup`

Membuat user baru.

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "createdAt": "2025-11-02T00:00:00.000Z",
    "updatedAt": "2025-11-02T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

### 2. Sign In (Login)

**POST** `/auth/signin`

Login dengan username dan password.

**Request Body:**

```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Refresh Token

**POST** `/auth/refresh`

Mendapatkan access token baru menggunakan refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout

**POST** `/auth/logout`

Logout dan invalidate refresh token.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

### 5. Get Profile

**GET** `/auth/profile`

Mendapatkan informasi user yang sedang login.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "userId": 1,
  "username": "johndoe",
  "email": "user@example.com"
}
```

## Token Expiration

- **Access Token**: 15 menit
- **Refresh Token**: 7 hari

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["username should not be empty"]
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Username already exists"
}
```

## Usage Flow

1. **Register**: `POST /auth/signup`
2. **Login**: `POST /auth/signin` → Simpan `accessToken` dan `refreshToken`
3. **Access Protected Routes**: Gunakan `accessToken` di header `Authorization: Bearer <token>`
4. **Token Expired**: Jika access token expired (401), gunakan `POST /auth/refresh` dengan `refreshToken`
5. **Logout**: `POST /auth/logout` dengan access token
