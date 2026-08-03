# EngWithMe Enterprise - Deployment & Security Operations Manual

## 1. Overview

This document specifies deployment workflows, security rules, environment configuration, and Git repository guidelines for **EngWithMe Enterprise**.

---

## 2. Environment Variables & Secret Configuration

### 2.1. Cloudflare Workers Secret Management (`be/worker-hono`)

In production environments, secret credentials **MUST NEVER** be stored in clear text inside `wrangler.toml` or committed to Git. Instead, leverage Cloudflare's encrypted secrets store:

```bash
# Navigate to Cloudflare Hono Worker directory
cd be/worker-hono

# Add Google OAuth Client Secret to Cloudflare Secrets Store
npx wrangler secret put GOOGLE_CLIENT_SECRET

# Add Resend Email API Key
npx wrangler secret put RESEND_API_KEY

# Add JWT Signature Key
npx wrangler secret put JWT_SECRET
```

### 2.2. Sample `.env` Template (`.env.example`)
Create a `.env` file from `.env.example` in local development environments:

```ini
# Application Configuration
APP_NAME="EngWithMe"
APP_ENV=local
APP_DEBUG=true

# Database Credentials
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=engwithme_db
DB_USER=root
DB_PASS=secret_password

# Authentication & OAuth
JWT_SECRET=EWM_SECURE_JWT_SECRET_KEY_2026_PRODUCTION
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 3. Git Repository & Security Audit Rules

### 3.1. File Classification Guide

| Path | Description | Version Control |
| :--- | :--- | :--- |
| `fe/` | Frontend Assets, HTML, CSS, JavaScript | 🟢 Commit & Push |
| `be/src/` | Backend Code & Edge Worker Routers | 🟢 Commit & Push |
| `docs/` | Architecture, Database & API Specs | 🟢 Commit & Push |
| `.gitignore` | Git Exclusion Rules | 🟢 Commit & Push |
| `scratch/` | Temporary Data Dumps & Scratch Scripts | 🔴 **DO NOT PUSH (Ignored)** |
| `node_modules/` | Package Dependencies | 🔴 **DO NOT PUSH (Ignored)** |
| `.vercel/` | Vercel Deployment Artifacts | 🔴 **DO NOT PUSH (Ignored)** |
| `.env` | Plaintext Secret Passwords & Tokens | 🔴 **DO NOT PUSH (Ignored)** |
| `*.log`, `*.sql` | System Logs & Raw Database Dumps | 🔴 **DO NOT PUSH (Ignored)** |

---

## 4. Production Deployment Workflow

### 4.1. Deploying Frontend to Vercel (Production)
```bash
# Navigate to Frontend directory
cd fe

# Trigger Vercel Production Build & Global CDN Deployment
npx vercel --prod --yes
```

### 4.2. Deploying Edge API Worker to Cloudflare
```bash
# Navigate to Worker directory
cd be/worker-hono

# Run D1 Database Migrations (Production Edge D1)
npx wrangler d1 execute engwithme-db --remote --file=./migrations/schema.sql

# Deploy Workers Code to Cloudflare Edge Nodes
npx wrangler deploy
```

---

## 5. Security Checklists Before Pushing to GitHub

1. [x] **Verify `.gitignore`**: Ensure `node_modules`, `.env`, `.vercel`, `scratch/`, and `*.log` are listed.
2. [x] **Audit Plaintext Passwords**: Verify no production database passwords or JWT private keys are hardcoded in tracked files.
3. [x] **Test Local CORS & Headers**: Confirm production domain `https://engwithme.tungf.io.vn` is set for production CORS.
4. [x] **Execute Build Validation**: Verify Vercel & Wrangler CLI builds exit clean with code `0`.
