import { Router } from 'express';
import { body, param } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

async function assertMember(chatId, userId) {
  const { data, error } = await supabaseAdmin
    .from('chat_participants')
    .select('id')
    .eq('chat_id', chatId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) {
    const forbidden = new Error('You are not a participant in this chat');
    forbidden.status = 403;
    throw forbidden;
  }
}

router.get('/:chatId', param('chatId').isUUID(), validate, async (req, res, next) => {
  try {
    await assertMember(req.params.chatId, req.userId);
    let query = supabaseAdmin
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(*), reactions(*), media_files(*)')
      .eq('chat_id', req.params.chatId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(40);
    if (req.query.cursor) query = query.lt('created_at', req.query.cursor);
    const { data, error } = await query;
    if (error) throw error;
    const messages = [...data].reverse();
    res.json({ messages, nextCursor: messages[0]?.created_at || null });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  [body('chatId').isUUID(), body('content').optional().isLength({ max: 6000 }), body('replyTo').optional().isUUID(), body('mediaFileIds').optional().isArray()],
  validate,
  async (req, res, next) => {
    try {
      await assertMember(req.body.chatId, req.userId);
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert({
          chat_id: req.body.chatId,
          sender_id: req.userId,
          content: req.body.content || '',
          reply_to_id: req.body.replyTo || null,
          status: 'sent'
        })
        .select('*, sender:users!messages_sender_id_fkey(*), reactions(*), media_files(*)')
        .single();
      if (error) throw error;

      if (req.body.mediaFileIds?.length) {
        await supabaseAdmin.from('media_files').update({ message_id: message.id }).in('id', req.body.mediaFileIds);
      }
      await supabaseAdmin.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', req.body.chatId);
      req.app.get('io')?.to(`chat:${req.body.chatId}`).emit('message:new', message);
      res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  }
);

router.patch('/:id', [param('id').isUUID(), body('content').isLength({ min: 1, max: 6000 })], validate, async (req, res, next) => {
  try {
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .update({ content: req.body.content, edited_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('sender_id', req.userId)
      .select('*')
      .single();
    if (error) throw error;
    req.app.get('io')?.to(`chat:${message.chat_id}`).emit('message:update', message);
    res.json({ message });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', param('id').isUUID(), validate, async (req, res, next) => {
  try {
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('sender_id', req.userId)
      .select('*')
      .single();
    if (error) throw error;
    req.app.get('io')?.to(`chat:${message.chat_id}`).emit('message:delete', message);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reactions', [param('id').isUUID(), body('emoji').isString().isLength({ min: 1, max: 16 })], validate, async (req, res, next) => {
  try {
    const { data: message, error: messageError } = await supabaseAdmin.from('messages').select('chat_id').eq('id', req.params.id).single();
    if (messageError) throw messageError;
    await assertMember(message.chat_id, req.userId);
    const { data, error } = await supabaseAdmin
      .from('reactions')
      .upsert({ message_id: req.params.id, user_id: req.userId, emoji: req.body.emoji }, { onConflict: 'message_id,user_id,emoji' })
      .select('*')
      .single();
    if (error) throw error;
    req.app.get('io')?.to(`chat:${message.chat_id}`).emit('reaction:new', data);
    res.status(201).json({ reaction: data });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/pin', param('id').isUUID(), validate, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ pinned_at: new Date().toISOString(), pinned_by: req.userId })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    req.app.get('io')?.to(`chat:${data.chat_id}`).emit('message:update', data);
    res.json({ message: data });
  } catch (error) {
    next(error);
  }
});

export default router;
