# Deployment

## Frontend on Vercel

1. Create a Vercel project using `frontend/` as the root directory.
2. Set environment variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=https://your-railway-service.up.railway.app/api
VITE_SOCKET_URL=https://your-railway-service.up.railway.app
VITE_APP_NAME=TELEchat
```

3. Build command: `npm run build`
4. Output directory: `dist`

`frontend/vercel.json` rewrites SPA routes to `index.html`.

## Backend on Railway

1. Create a Railway service using `backend/` as the root directory.
2. Add environment variables:

```text
NODE_ENV=production
PORT=8080
CLIENT_URL=https://your-vercel-app.vercel.app
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
JWT_EXPIRES_IN=7d
TURN_URL=
TURN_USERNAME=
TURN_CREDENTIAL=
```

3. Start command: `npm start`

## Supabase

1. Run `docs/supabase/schema.sql`.
2. Enable Email and Phone providers in Auth.
3. Add redirect URLs:
   - `http://localhost:5173/reset-password`
   - `https://your-vercel-app.vercel.app/reset-password`
4. Confirm Realtime is enabled for `chats`, `chat_participants`, `messages`, `reactions`, `notifications`, and `calls`.

## TURN server

STUN is enough for local tests and many networks. Production WebRTC needs TURN for restrictive NATs. Use a managed TURN provider or deploy coturn, then set:

```text
TURN_URL=turn:turn.example.com:3478
TURN_USERNAME=...
TURN_CREDENTIAL=...
```
