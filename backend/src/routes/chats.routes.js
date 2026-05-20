import { Router } from 'express';
import { body } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { data: memberships, error } = await supabaseAdmin
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', req.userId)
      .is('archived_at', null);
    if (error) throw error;

    const chatIds = memberships.map((item) => item.chat_id);
    if (!chatIds.length) return res.json({ chats: [] });

    const { data: chats, error: chatsError } = await supabaseAdmin
      .from('chats')
      .select('*, participants:chat_participants(*, profile:users(*)), last_message:messages(*)')
      .in('id', chatIds)
      .order('updated_at', { ascending: false });
    if (chatsError) throw chatsError;

    const shaped = chats.map((chat) => ({
      ...chat,
      unread_count: 0,
      last_message: Array.isArray(chat.last_message) ? chat.last_message.at(-1) : chat.last_message,
      peer: chat.participants?.find((participant) => participant.user_id !== req.userId)?.profile
    }));
    res.json({ chats: shaped });
  } catch (error) {
    next(error);
  }
});

router.post('/direct', body('participantId').isUUID(), validate, async (req, res, next) => {
  try {
    const participantId = req.body.participantId;
    const { data: existing } = await supabaseAdmin.rpc('find_direct_chat', {
      first_user: req.userId,
      second_user: participantId
    });
    if (existing) return res.json({ chat: existing });

    const { data: chat, error } = await supabaseAdmin.from('chats').insert({ type: 'direct' }).select('*').single();
    if (error) throw error;
    const { error: participantError } = await supabaseAdmin.from('chat_participants').insert([
      { chat_id: chat.id, user_id: req.userId, role: 'owner' },
      { chat_id: chat.id, user_id: participantId, role: 'member' }
    ]);
    if (participantError) throw participantError;
    res.status(201).json({ chat });
  } catch (error) {
    next(error);
  }
});

router.post('/:chatId/archive', async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('chat_participants')
      .update({ archived_at: new Date().toISOString() })
      .eq('chat_id', req.params.chatId)
      .eq('user_id', req.userId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
