import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { body } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.post(
  '/',
  [body('title').isLength({ min: 2, max: 80 }), body('description').optional().isLength({ max: 240 }), body('isPublic').optional().isBoolean()],
  validate,
  async (req, res, next) => {
    try {
      const { data: chat, error: chatError } = await supabaseAdmin
        .from('chats')
        .insert({ type: 'group', title: req.body.title, description: req.body.description })
        .select('*')
        .single();
      if (chatError) throw chatError;

      const inviteCode = randomUUID();
      const { data: group, error: groupError } = await supabaseAdmin
        .from('groups')
        .insert({
          chat_id: chat.id,
          owner_id: req.userId,
          title: req.body.title,
          description: req.body.description,
          is_public: req.body.isPublic || false,
          invite_code: inviteCode
        })
        .select('*')
        .single();
      if (groupError) throw groupError;

      await supabaseAdmin.from('chat_participants').insert({ chat_id: chat.id, user_id: req.userId, role: 'owner' });
      res.status(201).json({ chat, group });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:groupId/members', [body('userId').isUUID(), body('role').optional().isIn(['member', 'admin'])], validate, async (req, res, next) => {
  try {
    const { data: group, error } = await supabaseAdmin.from('groups').select('*').eq('id', req.params.groupId).single();
    if (error) throw error;
    const { error: memberError } = await supabaseAdmin
      .from('chat_participants')
      .upsert({ chat_id: group.chat_id, user_id: req.body.userId, role: req.body.role || 'member' }, { onConflict: 'chat_id,user_id' });
    if (memberError) throw memberError;
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:groupId/members/:userId', async (req, res, next) => {
  try {
    const { data: group, error } = await supabaseAdmin.from('groups').select('*').eq('id', req.params.groupId).single();
    if (error) throw error;
    await supabaseAdmin.from('chat_participants').delete().eq('chat_id', group.chat_id).eq('user_id', req.params.userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
