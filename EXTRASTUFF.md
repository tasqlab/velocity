# Extra Information

## 🔐 Google OAuth Testing

If you want to sign in with Google, contact the project owner and provide your email to be added to the Google OAuth testing list.

---

## 📧 Email Templates Setup

The project includes 5 branded email templates in `supabase/templates/`:

1. **recovery.html** - Password reset emails
2. **confirmation.html** - Email signup confirmation
3. **invite.html** - User invitations
4. **email_change.html** - Email change confirmation
5. **password_changed_notification.html** - Password change notification

### How to configure:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Email Templates**
4. Copy the HTML content from each template file into the corresponding template
5. Update the **Site URL** to: `https://tasqlab.github.io/velocity`
6. Add redirect URLs: `https://tasqlab.github.io/velocity/reset-password`

---

## 🔄 Password Reset Flow

The forgot password feature is now fully implemented:

1. User visits `/forgot-password`
2. Enters their email address
3. Receives email with reset link
4. Clicks link to `/reset-password`
5. Sets new password
6. Automatically redirected to login

**Features:**
- Enter key navigation (password field → confirm field → submit)
- Real-time validation
- Password visibility toggle
- Loading states
- Success/error feedback

---

## 🛡️ Security Notes

- All password reset links expire after 1 hour
- Email confirmation links expire after 24 hours
- Session is checked before allowing password reset
- RLS policies protect all user data
- End-to-end encryption on all messages (Velocity Shield™)

---

## 📝 Development Notes

### Adding New Features
1. Check TODO.md for planned features
2. Create feature branch
3. Update TODO.md when complete

### Database Changes
1. Create migration in `supabase/migrations/`
2. Apply via Supabase CLI
3. Update types if needed

### UI Theme
- Primary gradient: `#2563eb` (blue) → `#06b6d4` (cyan)
- Background: `#0a0a0f`
- Card backgrounds: `rgba(255,255,255,0.05)` with blur
- Font: Plus Jakarta Sans
