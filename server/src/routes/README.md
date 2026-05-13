# Authentication Routes

This document describes the authentication endpoints implemented in `auth.routes.ts`.

## Endpoints

### POST /api/auth/register

Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1234567890
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400`: Invalid request body (validation error)
- `409`: Email already exists
- `500`: Server error

---

### POST /api/auth/login

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1234567890
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400`: Invalid request body
- `401`: Invalid email or password
- `500`: Server error

---

### POST /api/auth/logout

Logout user and invalidate session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `401`: Missing or invalid authorization header
- `401`: Invalid session
- `500`: Server error

---

### POST /api/auth/reset-password

Send password reset email to user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent. Please check your inbox."
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400`: Invalid request body
- `500`: Server error

---

## Usage Example

```typescript
// Register a new user
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const { data } = await registerResponse.json();
const accessToken = data.session.access_token;

// Use the access token for authenticated requests
const logoutResponse = await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

## Integration

To use these routes in your Express application:

```typescript
import express from 'express';
import authRoutes from './routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
```

## Testing

Unit tests are available in:
- `controllers/auth.controller.test.ts` - Controller tests
- `services/auth.service.test.ts` - Service tests

Run tests with:
```bash
npm test
```
