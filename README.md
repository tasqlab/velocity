# ⚡ Velocity Chat

[![Website](https://img.shields.io/badge/Live%20Demo-2563eb?style=for-the-badge&logo=github&logoColor=white)](https://tasqlab.github.io/velocity)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

A modern, real-time messaging platform built with cutting-edge web technologies. Features end-to-end encryption, glass-morphism UI design, and seamless real-time communication.

---

## ✨ Features

- **🔐 End-to-End Encryption** — Velocity Shield™ secures all your conversations
- **⚡ Real-time Messaging** — Instant message delivery powered by Supabase Realtime
- **👥 Group & DM Support** — Create groups or chat privately with friends
- **🎨 Glass-morphism Design** — Modern, translucent UI with gradient accents
- **📱 Responsive Layout** — Works seamlessly on desktop and mobile
- **🌙 Dark Theme** — Sleek dark interface optimized for low-light environments

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS + Custom CSS Variables |
| **Backend** | Supabase (Postgres + Realtime) |
| **Authentication** | Supabase Auth |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project

### Installation

```bash
# Clone the repository
git clone https://github.com/tasqlab/velocity.git
cd velocity

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📁 Project Structure

```
velocity/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions & Supabase client
│   └── styles/          # Global styles
├── supabase/            # Database migrations
└── public/              # Static assets
```

---

## 🔗 Links

- **Live Demo**: [tasqlab.github.io/velocity](https://tasqlab.github.io/velocity)
- **Legacy Version**: [velocity-chat](https://tasqlab.github.io/velocity-chat/)

---

## 📄 License

MIT License — feel free to use this project for personal or commercial purposes.

---

<p align="center">
  <sub>Built with ⚡ by tasqlab</sub>
</p>
