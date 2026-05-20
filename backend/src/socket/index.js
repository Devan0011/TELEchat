import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { verifyJwt } from '../utils/jwt.js';

const onlineUsers = new Map();
const typingUsers = new Map();

function getTyping(chatId) {
  return Array.from(typingUsers.get(chatId)?.values() || []);
}

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL.split(',').map((item) => item.trim()),
      credentials: true
    },
    maxHttpBufferSize: 1e7
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing socket token'));
      const decoded = verifyJwt(token);
      const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', decoded.sub).single();
      if (error || !data) return next(new Error('Socket user not found'));
      socket.user = data;
      socket.userId = decoded.sub;
      return next();
    } catch {
      return next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', async (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    socket.join(`user:${socket.userId}`);
    await supabaseAdmin.from('users').update({ is_online: true, last_seen_at: new Date().toISOString() }).eq('id', socket.userId);
    io.emit('presence:update', { userId: socket.userId, isOnline: true });

    socket.on('chat:join', async ({ chatId }) => {
      const { data } = await supabaseAdmin
        .from('chat_participants')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', socket.userId)
        .maybeSingle();
      if (data) socket.join(`chat:${chatId}`);
    });

    socket.on('chat:leave', ({ chatId }) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('typing:set', ({ chatId, isTyping }) => {
      if (!typingUsers.has(chatId)) typingUsers.set(chatId, new Map());
      const room = typingUsers.get(chatId);
      if (isTyping) room.set(socket.userId, socket.user.username || socket.user.email);
      else room.delete(socket.userId);
      socket.to(`chat:${chatId}`).emit('typing:update', { chatId, users: getTyping(chatId) });
    });

    socket.on('message:seen', async ({ chatId, messageIds }) => {
      await supabaseAdmin
        .from('message_receipts')
        .upsert(
          messageIds.map((messageId) => ({
            message_id: messageId,
            user_id: socket.userId,
            seen_at: new Date().toISOString()
          })),
          { onConflict: 'message_id,user_id' }
        );
      socket.to(`chat:${chatId}`).emit('message:seen', { chatId, messageIds, userId: socket.userId });
    });

    socket.on('call:offer', async (payload) => {
      const { callId, toUserId, chatId, offer, video } = payload;
      await supabaseAdmin.from('calls').insert({
        id: callId,
        chat_id: chatId,
        caller_id: socket.userId,
        callee_id: toUserId,
        type: video ? 'video' : 'voice',
        status: 'ringing'
      });
      io.to(`user:${toUserId}`).emit('call:incoming', {
        callId,
        id: callId,
        chatId,
        fromUser: socket.user,
        peerId: socket.userId,
        offer,
        video
      });
    });

    socket.on('call:answer', async ({ callId, toUserId, answer }) => {
      await supabaseAdmin.from('calls').update({ status: 'active', answered_at: new Date().toISOString() }).eq('id', callId);
      io.to(`user:${toUserId}`).emit('call:answer', { callId, answer, fromUserId: socket.userId });
    });

    socket.on('call:ice-candidate', ({ callId, toUserId, candidate }) => {
      io.to(`user:${toUserId}`).emit('call:ice-candidate', { callId, candidate, fromUserId: socket.userId });
    });

    socket.on('call:reject', async ({ callId, toUserId }) => {
      await supabaseAdmin.from('calls').update({ status: 'rejected', ended_at: new Date().toISOString() }).eq('id', callId);
      io.to(`user:${toUserId}`).emit('call:end', { callId, reason: 'rejected' });
    });

    socket.on('call:end', async ({ callId, toUserId }) => {
      await supabaseAdmin.from('calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', callId);
      io.to(`user:${toUserId}`).emit('call:end', { callId, reason: 'ended' });
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(socket.userId);
      await supabaseAdmin.from('users').update({ is_online: false, last_seen_at: new Date().toISOString() }).eq('id', socket.userId);
      io.emit('presence:update', { userId: socket.userId, isOnline: false });
    });
  });

  return io;
}
