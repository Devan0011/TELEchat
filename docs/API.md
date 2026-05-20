# API Documentation

Base URL: `/api`

All protected endpoints require:

```http
Authorization: Bearer <telechat-jwt>
```

## Auth

`POST /auth/session`

Exchanges a Supabase access token for a TELEchat JWT and upserts the public profile.

```json
{
  "supabaseAccessToken": "sb-access-token"
}
```

`POST /auth/logout`

Marks the current user offline.

## Users

`GET /users/me` returns the authenticated user profile.

`PATCH /users/me` updates profile fields:

```json
{
  "username": "alex",
  "bio": "Building secure chats",
  "custom_status": "Available",
  "privacy": "contacts",
  "avatar_url": "https://..."
}
```

`GET /users/search?query=alex` searches username, email, and phone.

`POST /users/block` with `{ "blockedId": "uuid" }`.

`POST /users/mute` with `{ "mutedId": "uuid" }`.

## Chats and Groups

`GET /chats` lists chats for the current user.

`POST /chats/direct`

```json
{
  "participantId": "uuid"
}
```

`POST /chats/:chatId/archive` archives a chat for the current user.

`POST /groups` creates a group chat.

```json
{
  "title": "Design Team",
  "description": "Launch planning",
  "isPublic": false
}
```

`POST /groups/:groupId/members` adds or updates a member.

`DELETE /groups/:groupId/members/:userId` removes a member.

## Messages

`GET /messages/:chatId?cursor=timestamp` returns paginated messages.

`POST /messages`

```json
{
  "chatId": "uuid",
  "content": "**hello**",
  "replyTo": "uuid",
  "mediaFileIds": ["uuid"]
}
```

`PATCH /messages/:id` edits a message.

`DELETE /messages/:id` soft-deletes a message.

`POST /messages/:id/reactions` adds an emoji reaction.

`POST /messages/:id/pin` pins a message.

## Media

`POST /media/upload-url` creates a signed Supabase upload URL.

`POST /media` registers uploaded media metadata.

## Calls

`GET /calls/ice-servers` returns STUN/TURN configuration.

`POST /calls/history` persists call history.

## Notifications

`GET /notifications` lists notifications.

`POST /notifications/:id/read` marks one notification as read.

## Admin

Admin routes require `users.is_admin = true`.

`GET /admin/overview` returns platform counters.

`GET /admin/users` lists users for moderation.

`POST /admin/moderation`

```json
{
  "action": "ban_user",
  "targetId": "uuid"
}
```

Supported actions: `ban_user`, `unban_user`, `delete_user_content`.

## Socket.IO events

Client emits:

- `chat:join`
- `chat:leave`
- `typing:set`
- `message:seen`
- `call:offer`
- `call:answer`
- `call:ice-candidate`
- `call:reject`
- `call:end`

Server emits:

- `presence:update`
- `typing:update`
- `message:new`
- `message:update`
- `message:delete`
- `reaction:new`
- `notification:new`
- `call:incoming`
- `call:answer`
- `call:ice-candidate`
- `call:end`
