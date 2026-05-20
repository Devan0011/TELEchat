import { Router } from 'express';
import { body } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth, requireAdmin);

async function count(table, filters = []) {
  let query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  filters.forEach(([column, value]) => {
    query = query.eq(column, value);
  });
  const { count: total, error } = await query;
  if (error) throw error;
  return total || 0;
}

router.get('/overview', async (_req, res, next) => {
  try {
    const [users, messages, reports, banned] = await Promise.all([
      count('users'),
      count('messages'),
      count('reports'),
      count('users', [['is_banned', true]])
    ]);
    res.json({ users, messages, reports, banned });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, phone, username, avatar_url, is_online, is_admin, is_banned, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ users: data });
  } catch (error) {
    next(error);
  }
});

router.post('/moderation', [body('action').isString(), body('targetId').isUUID()], validate, async (req, res, next) => {
  try {
    const { action, targetId } = req.body;
    if (action === 'ban_user') {
      await supabaseAdmin.from('users').update({ is_banned: true, banned_at: new Date().toISOString() }).eq('id', targetId);
    }
    if (action === 'unban_user') {
      await supabaseAdmin.from('users').update({ is_banned: false, banned_at: null }).eq('id', targetId);
    }
    if (action === 'delete_user_content') {
      await supabaseAdmin.from('messages').update({ deleted_at: new Date().toISOString() }).eq('sender_id', targetId);
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
