import { Router } from 'express';
import { body, query } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/me', async (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, phone: req.user.phone }, profile: req.user });
});

router.patch(
  '/me',
  [
    body('username').optional().isLength({ min: 2, max: 32 }),
    body('bio').optional().isLength({ max: 180 }),
    body('custom_status').optional().isLength({ max: 80 }),
    body('privacy').optional().isIn(['everyone', 'contacts', 'private']),
    body('avatar_url').optional().isURL()
  ],
  validate,
  async (req, res, next) => {
    try {
      const allowed = ['username', 'bio', 'custom_status', 'privacy', 'avatar_url', 'settings'];
      const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', req.userId)
        .select('*')
        .single();
      if (error) throw error;
      res.json({ profile: data });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/me', async (req, res, next) => {
  try {
    await supabaseAdmin.from('users').update({ deleted_at: new Date().toISOString(), is_online: false }).eq('id', req.userId);
    await supabaseAdmin.auth.admin.deleteUser(req.userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get('/search', query('query').isString().isLength({ min: 2, max: 60 }), validate, async (req, res, next) => {
  try {
    const term = `%${req.query.query}%`;
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, phone, avatar_url, bio, is_online, last_seen_at')
      .is('deleted_at', null)
      .or(`username.ilike.${term},email.ilike.${term},phone.ilike.${term}`)
      .neq('id', req.userId)
      .limit(20);
    if (error) throw error;
    res.json({ users: data });
  } catch (error) {
    next(error);
  }
});

router.post('/block', body('blockedId').isUUID(), validate, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('blocked_users')
      .upsert({ blocker_id: req.userId, blocked_id: req.body.blockedId }, { onConflict: 'blocker_id,blocked_id' });
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post('/mute', body('mutedId').isUUID(), validate, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('muted_users')
      .upsert({ user_id: req.userId, muted_user_id: req.body.mutedId }, { onConflict: 'user_id,muted_user_id' });
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
