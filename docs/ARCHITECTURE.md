# Architecture

## Frontend

React + Vite provides the SPA shell. Zustand stores auth and chat state. Context providers own Socket.IO and WebRTC lifecycle. Supabase JS is used directly for Auth and Storage; the Express API is used for protected application data and moderation workflows.

Key modules:

- `src/services/supabase.js`: Supabase client.
- `src/services/api.js`: Axios API client with JWT interceptor.
- `src/context/SocketContext.jsx`: socket lifecycle, chat rooms, typing events.
- `src/context/CallContext.jsx`: WebRTC peer connection and call controls.
- `src/store/useAuthStore.js`: Supabase auth plus TELEchat JWT session.
- `src/store/useChatStore.js`: chats, messages, drafts, typing state.

## Backend

Express handles secure REST endpoints, JWT verification, input validation, rate limiting, and sanitization. Socket.IO coordinates realtime presence, typing, message notifications, read receipts, and WebRTC signaling. Supabase remains the only persistence/auth/storage provider.

## Data model

`public.users` mirrors Supabase Auth users with profile, privacy, status, and admin flags. `chats`, `chat_participants`, `messages`, `media_files`, and `reactions` form the core messaging model. `groups`, `communities`, and `community_groups` extend chats into larger social structures. `calls` and `call_history` persist WebRTC call state.

## Security posture

- Supabase Auth is the identity provider.
- Backend JWTs are short, signed server tokens derived from a verified Supabase session.
- RLS is enabled on all public tables.
- Service role key is backend-only.
- Inputs are validated and sanitized before Supabase writes.
- Express uses Helmet, CORS allow-listing, compression, and rate limiting.

## Scaling notes

For multi-instance Socket.IO on Railway, add a Redis adapter so socket rooms and call signaling work across replicas. Supabase remains the source of truth for data, while Redis only coordinates socket fan-out.
