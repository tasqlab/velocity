# Velocity Chat - Todo List

## ✅ Completed

### Core Features
- [x] React 18 + TypeScript setup with Vite
- [x] Tailwind CSS with custom dark theme
- [x] Supabase integration (Auth + Realtime + Postgres)
- [x] Landing page with glass-morphism design
- [x] Authentication system (Login/Signup)
- [x] Real-time messaging with Supabase Realtime
- [x] End-to-end encryption (Velocity Shield™) — **AES-256-GCM with PBKDF2 key derivation**
- [x] Group chat and DM support
- [x] User profiles with avatars
- [x] Responsive layout for mobile/desktop
- [x] Dark theme throughout
- [x] Settings page with appearance toggle

### UI/UX Improvements
- [x] Blue/cyan gradient theme (#2563eb to #06b6d4)
- [x] Lightning bolt logo replacing "V"
- [x] Message reactions (emoji)
- [x] File attachments in messages
- [x] Typing indicators
- [x] Online status indicators
- [x] Push notification toggle in settings

### Authentication & Security
- [x] Google OAuth sign-in integration
- [x] **Forgot Password page** (`/forgot-password`)
- [x] **Reset Password page** (`/reset-password`)
- [x] Password reset email flow
- [x] Email confirmation templates
- [x] Supabase Auth email templates (5 templates created)
- [x] Session management

### Database & Storage
- [x] Database migrations structure
- [x] Messages table with encryption
- [x] Groups and group members
- [x] Reactions table
- [x] Storage bucket for file attachments
- [x] Row Level Security (RLS) policies

### DevOps
- [x] GitHub Pages deployment workflow
- [x] GitHub Actions CI/CD
- [x] Environment variable handling

## ✅ Completed (Items 5-11)

### Features (Recently Added)
- [x] **Message search functionality** — Search within conversations
- [x] **Threaded replies** — Reply to specific messages with context
- [x] **Voice messages** — Record and send audio messages
- [x] **Video calls (WebRTC)** — Audio/video calling with Jitsi integration
- [x] **Message drafts** — Auto-save unsent messages
- [x] **Scheduled messages** — Schedule messages for later delivery
- [x] **Pinned messages** — Pin important messages in chats

## 🚧 In Progress / To Do

### Features
- [ ] Message editing
- [ ] Delete messages for everyone

### Polish
- [ ] Loading skeletons
- [ ] Empty states illustrations
- [ ] Error boundary pages
- [ ] Onboarding flow for new users
- [ ] Keyboard shortcuts help

### DevOps
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Playwright)
- [ ] Pre-commit hooks (Husky)
- [ ] Automated dependency updates

## 📋 Notes

### Email Templates Setup
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Copy content from `supabase/templates/` files
3. Configure Site URL: `https://tasqlab.github.io/velocity`
4. Add redirect URLs for password reset

### Google OAuth
Contact project owner to be added to Google OAuth testing list if you need to test Google sign-in.

### Last Updated
April 26, 2026
