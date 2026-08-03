# EngWithMe Enterprise - RESTful API Specification & Developer Guide

## 1. Base API Endpoints

* **Production Cloudflare Edge API**: `https://engwithme-hono-edge.tungduong-dev.workers.dev/v1/`
* **Local Development PHP Fallback API**: `http://localhost/projects/EngWithMe/be/api/v1/`

All request payloads and responses format JSON (`Content-Type: application/json`).
Protected endpoints require HTTP Header `Authorization: Bearer <JWT_TOKEN>`.

---

## 2. Authentication API (`/v1/auth/*`)

### 2.1. Student Registration (`POST /auth/register`)
Creates a new student user account with password hashing.

* **Request Body**:
  ```json
  {
    "full_name": "Nguyen Van A",
    "email": "student@example.com",
    "password": "securepassword123"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "message": "Đăng ký tài khoản thành công!",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 42,
      "email": "student@example.com",
      "full_name": "Nguyen Van A",
      "role": "user",
      "status": "active"
    }
  }
  ```
* **Error Response (`400 Bad Request`)**:
  ```json
  {
    "status": "error",
    "message": "Email đã tồn tại trên hệ thống!"
  }
  ```

---

### 2.2. Password Login (`POST /auth/login`)
Authenticates user email and password, returning signed JWT token.

* **Request Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "securepassword123"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 42,
      "email": "student@example.com",
      "full_name": "Nguyen Van A",
      "role": "user",
      "avatar": null
    }
  }
  ```

---

### 2.3. Google OAuth 2.0 Identity Login (`GET /auth/google`)
Redirects browser to Google Auth Consent Screen and exchanges authorization codes seamlessly for a JWT session.

---

## 3. User & Profile API (`/v1/user/*`)

### 3.1. Fetch Current User Profile (`GET /user/profile`)
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": 42,
      "email": "student@example.com",
      "full_name": "Nguyen Van A",
      "role": "user",
      "status": "active",
      "created_at": "2026-08-01 10:00:00"
    }
  }
  ```

---

### 3.2. Update Password (`POST /user/update-password`)
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "old_password": "securepassword123",
    "new_password": "newpassword456"
  }
  ```

---

## 4. Admin Management API (`/v1/admin/*`)

### 4.1. Fetch Users List & Admin Metrics (`GET /admin/users`)
* **Headers**: `Authorization: Bearer <admin_token>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "stats": {
      "total": 42,
      "admins": 1,
      "learners": 41,
      "active": 40,
      "locked": 2,
      "newToday": 3
    },
    "users": [
      {
        "id": 1,
        "email": "admin1301@gmail.com",
        "full_name": "Nguyen Tung Duong (Admin)",
        "role": "admin",
        "status": "active"
      }
    ]
  }
  ```

---

### 4.2. Update User Role & Status (`POST /admin/users/update`)
* **Headers**: `Authorization: Bearer <admin_token>`
* **Request Body**:
  ```json
  {
    "user_id": 42,
    "role": "manager",
    "status": "active"
  }
  ```

---

### 4.3. Cascade Delete Account (`POST /admin/users/delete`)
Purges target account along with 100% of all associated transaction orders, notifications, study progress, exam attempts, and blog posts across all database tables.

* **Headers**: `Authorization: Bearer <admin_token>`
* **Request Body**:
  ```json
  {
    "user_id": 42
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Đã xóa 100% tài khoản và sạch dữ liệu liên quan ở tất cả các bảng!"
  }
  ```

---

### 4.4. Broadcast System Notification (`POST /admin/notifications/broadcast`)
Sends a platform-wide maintenance or announcement notification to all active students.

* **Headers**: `Authorization: Bearer <admin_token>`
* **Request Body**:
  ```json
  {
    "title": "Bảo trì Hệ thống từ 00:00 - 02:00",
    "message": "Nâng cấp tính năng học từ vựng và tối ưu tốc độ máy chủ.",
    "tag": "system"
  }
  ```
