# TELEchat

TELEchat is a full-stack real-time messaging platform scaffold built with React + Vite, Node.js + Express, Socket.IO, Supabase Auth/Database/Storage/Realtime, JWT sessions, and WebRTC calling.

## What is included

- Email/password auth, phone OTP hooks, reset password, Supabase Auth session exchange, JWT protected API routes.
- Responsive premium chat UI with dark theme, glassmorphism, neumorphic panels, skeletons, modals, hover states, and mobile-first layouts.
- One-to-one chat creation, message history, realtime Socket.IO rooms, typing indicators, reactions, pinning, edits, deletes, read receipt signaling, drafts, markdown rendering, and file upload hooks.
- Supabase Storage integration for avatars and chat media.
- WebRTC one-to-one voice/video calling with Socket.IO signaling, STUN/TURN configuration, screen sharing, mute/camera controls, and call persistence.
- Group/community schema, group creation route, member management route, admin dashboard routes, moderation actions, notifications, settings, block/mute/archive tables.
- Vercel frontend config, Railway backend config, PWA manifest/service worker, modular folders, shared constants/types, and SQL schema with RLS policies.

## Folder structure

```text
frontend/
  public/
  src/
    components/
    context/
    pages/
    routes/
    services/
    store/
    styles/
backend/
  src/
    config/
    middleware/
    routes/
    socket/
    utils/
    webrtc/
shared/
docs/
  supabase/schema.sql
```

## Local setup

1. Create a Supabase project.
2. Run `docs/supabase/schema.sql` in the Supabase SQL editor.
3. Copy `frontend/.env.example` to `frontend/.env` and fill in values.
4. Copy `backend/.env.example` to `backend/.env` and fill in values.
5. Install dependencies:

```bash
npm install
```

6. Start both apps:

```bash
npm run dev:backend
npm run dev:frontend
```

The frontend runs on `http://localhost:5173`; the backend runs on `http://localhost:8080`.

## Supabase setup notes

- Enable Email auth and Phone auth providers in Supabase.
- Configure email redirect URLs to include `http://localhost:5173/reset-password` and your Vercel production URL.
- Create Storage buckets using the SQL file or via the Supabase dashboard.
- Keep the service role key only in the backend environment.

## Production deployment

- Frontend: import `frontend/` into Vercel, set Vite environment variables, deploy.
- Backend: import `backend/` into Railway, set backend environment variables, deploy.
- Supabase: run the schema, configure Auth redirect URLs, and enable Realtime for the listed tables.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/API.md](docs/API.md) for details.
