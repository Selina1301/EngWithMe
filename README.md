# 🚀 EngWithMe - Enterprise 2-Tier Decoupled Web Architecture

EngWithMe is an advanced English learning application built with a decoupled 2-tier architecture:
- **Frontend (`fe/`)**: Single-Page / Multi-Page Static Web App (HTML5, CSS3, Vanilla JS, ApiClient, Glassmorphic UI).
- **Backend (`be/`)**: Modular PHP 8 REST API Suite, Layered Business Services, MySQL Database, JWT Stateless Auth, Rate Limiter, and Media Storage Engine.

---

## 📁 Repository Structure

```
EngWithMe/
├── fe/                            # Single-Page / Multi-Page Static Frontend (Vercel / Netlify / Cloudflare Pages)
│   ├── index.html
│   ├── blog.html
│   ├── listening.html
│   ├── profile.html
│   ├── ... (all 22 HTML pages)
│   ├── components/                # Reusable Shared Layout Components (navbar.html, footer.html)
│   ├── css/                       # Modular Stylesheets & Glassmorphism Tokens
│   ├── js/
│   │   ├── config.js              # Centralized API Base & Environment Manager
│   │   ├── api.js                 # Unified ApiClient for all REST API endpoints
│   │   ├── components.js          # Shared Layout Component Loader
│   │   ├── core.js                # Core Authentication, SWR Cache & Notification Engine
│   │   └── ...
│   ├── assets/
│   ├── audio/
│   └── images/
│
├── be/                            # Modular Backend Engine (PHP 8 / MySQL / cPanel / Railway / Render)
│   ├── api/
│   │   └── v1/                    # Versioned REST API Endpoints
│   │       ├── auth/              # login.php, logout.php, register.php, verify_otp.php, google.php, forgot_password.php, reset_password.php
│   │       ├── user/              # me.php, profile.php, change_password.php, admin_users.php, user_level.php
│   │       ├── blog/              # get_blogs.php, get_pending_blogs.php, submit_blog.php, approve_blog.php, toggle_blog_like.php, increment_blog_view.php
│   │       ├── notification/      # notifications.php (list, mark_read, delete_all, generate)
│   │       ├── learning/          # learning_content.php, get_exam_questions.php, leaderboard.php, sync_progress.php, test_results.php
│   │       └── payment/           # create_payment.php, check_payment_status.php, payos_webhook.php
│   │
│   ├── services/                  # Business Logic Layer (API -> Service -> DB)
│   │   ├── AuthService.php        # Authentication & Token Manager
│   │   ├── UserService.php        # User Profiles, Level & RBAC Role Enforcement
│   │   ├── BlogService.php        # Blog Posts & Reward System
│   │   ├── NotificationService.php# Personalized Notifications Engine
│   │   ├── LearningService.php    # Vocabulary, TOEIC Exam & Course Sync
│   │   ├── PaymentService.php     # PayOS Integration & Webhook Handler
│   │   ├── UploadService.php      # Local + Cloudinary / S3 Storage Abstraction
│   │   ├── Validator.php          # Request Input Validation Engine
│   │   ├── RateLimiter.php        # Security Rate Limiting (IP & User Brute-force protection)
│   │   ├── JwtService.php         # HMAC-SHA256 Stateless Token Engine
│   │   └── LoggerService.php       # Enterprise Logging Engine
│   │
│   ├── database/                  # MySQL Schemas & Migrations
│   ├── storage/                   # System Logs & Sessions
│   ├── uploads/                   # Media Uploads (Avatars)
│   └── tools/                     # Text-to-Speech Audio Generators & Admin Tools
│
├── README.md                      # Comprehensive Architecture & Deployment Guide
└── .gitignore                     # Git Exclusions
```

---

## 🛠 Local Development Setup (XAMPP / WAMP)

1. Place the `EngWithMe` folder inside `htdocs`:
   `C:\xampp\htdocs\projects\EngWithMe`
2. Start Apache and MySQL in XAMPP Control Panel.
3. Import Database Schema:
   - Open `http://localhost/phpmyadmin`
   - Create database `engwithme_db` (utf8mb4_unicode_ci)
   - Import `be/database/database_schema.sql`
4. Access Frontend in Browser:
   `http://localhost/projects/EngWithMe/fe/index.html`

---

## 🌐 Production Deployment Guide

### Option A: Hosting Frontend on Vercel Free + Backend on cPanel / Railway / Render

1. **Deploy Frontend (`fe/`) to Vercel**:
   - Push repository to GitHub.
   - On Vercel, set **Root Directory** to `fe/`.
   - Deploy! (Vercel hosts the static HTML/CSS/JS with zero-latency global CDN).

2. **Deploy Backend (`be/`) to cPanel / Railway / Render**:
   - Upload `be/` directory to PHP server or host container on Railway/Render.
   - Import `be/database/database_schema.sql` to your Cloud MySQL database.
   - Configure `.env` with production MySQL credentials.

3. **Connect Frontend to Backend**:
   - In `fe/js/config.js`, update `window.EWM_CUSTOM_API_BASE` to point to your backend API URL (e.g. `https://api.yourdomain.com/be/api/v1/`).
   - CORS is pre-configured in `be/services/helpers.php` allowing cross-origin requests with credentials!
