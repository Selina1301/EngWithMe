-- Migration: Add Verification Status and Token to users table
ALTER TABLE users MODIFY COLUMN status ENUM('active', 'locked', 'pending') NOT NULL DEFAULT 'pending';
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL AFTER reset_token_expires_at;
