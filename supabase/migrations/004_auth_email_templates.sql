-- Auth Email Templates Setup for Velocity
-- This migration contains instructions for configuring email templates
-- and SQL for auth-related settings

-- ============================================
-- IMPORTANT: Email Template Configuration
-- ============================================
-- For hosted Supabase projects, email templates must be configured 
-- through the Supabase Dashboard at:
-- https://supabase.com/dashboard/project/_/auth/templates
--
-- Copy the HTML content from these files into the dashboard:
-- - supabase/templates/recovery.html -> "Reset Password" template
-- - supabase/templates/confirmation.html -> "Confirm Signup" template
-- - supabase/templates/invite.html -> "Invite User" template
-- - supabase/templates/email_change.html -> "Email Change" template
--
-- Template Variables Available:
-- - {{ .ConfirmationURL }} - The confirmation/reset URL
-- - {{ .Token }} - 6-digit OTP code
-- - {{ .TokenHash }} - Hashed token for custom URLs
-- - {{ .SiteURL }} - Your application's site URL
-- - {{ .Email }} - User's email address
-- - {{ .NewEmail }} - New email (for email change)
-- - {{ .OldEmail }} - Old email (for email change notification)
-- ============================================

-- Enable email confirmations (if not already enabled)
-- This is typically configured in the Dashboard under Auth Settings

-- Create a function to handle password reset events (optional)
CREATE OR REPLACE FUNCTION handle_password_reset()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the reset attempt (optional analytics/logging)
  -- INSERT INTO audit_logs (action, user_id, metadata)
  -- VALUES ('password_reset_requested', NEW.user_id, jsonb_build_object('email', NEW.email));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy to allow users to update their own password
-- (This is handled by Supabase Auth automatically)

-- Ensure auth.users has proper email confirmation settings
-- Note: These are configuration settings, not SQL changes
-- Configure in Dashboard: Auth > Settings > Email Auth
-- - Enable "Enable Email Confirmations"
-- - Set "Secure email change" to true
-- - Set "JWT expiration" to 3600 (1 hour) for password reset tokens

-- ============================================
-- Google OAuth Setup Instructions
-- ============================================
-- 1. Go to Supabase Dashboard > Auth > Providers > Google
-- 2. Enable Google provider
-- 3. Add your Google OAuth credentials (Client ID and Secret)
-- 4. Configure Authorized redirect URI in Google Console:
--    https://<project-ref>.supabase.co/auth/v1/callback
-- 5. Add your domain to "Authorized JavaScript origins"

-- ============================================
-- Site URL and Redirect URLs Configuration
-- ============================================
-- Configure in Dashboard: Auth > URL Configuration
-- Site URL: https://tasqlab.github.io/velocity (production)
--           http://localhost:5173 (development)
-- 
-- Redirect URLs:
-- - https://tasqlab.github.io/velocity/reset-password
-- - http://localhost:5173/reset-password
-- - https://tasqlab.github.io/velocity
-- - http://localhost:5173

-- ============================================
-- Storage Setup for Email Attachments (Optional)
-- ============================================
-- If you want to include logos/images in emails,
-- upload them to Storage and use public URLs

-- ============================================
-- Security Settings
-- ============================================
-- Recommended settings for production:
-- - Enable "Enable Custom SMTP" for better deliverability
-- - Set password min length to 8
-- - Enable "Prevent reuse of previous passwords"
-- - Set "Max user sessions" to 10
-- - Enable "Enable MFA" for enhanced security
