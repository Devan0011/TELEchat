import { Router } from 'express';
import { body } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { signJwt } from '../utils/jwt.js';

const router = Router();

router.post('/session', body('supabaseAccessToken').isString().notEmpty(), validate, async (req, res, next) => {
  try {
    const { supabaseAccessToken } = req.body;
    const { data, error } = await supabaseAdmin.auth.getUser(supabaseAccessToken);
    if (error || !data.user) return res.status(401).json({ message: 'Invalid Supabase session' });

    const authUser = data.user;
    const profilePayload = {
      id: authUser.id,
      email: authUser.email,
      phone: authUser.phone,
      username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || `user_${authUser.id.slice(0, 6)}`,
      last_seen_at: new Date().toISOString(),
      is_online: true
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert(profilePayload, { onConflict: 'id' })
      .select('*')
      .single();

    if (profileError) throw profileError;
    const token = signJwt({ sub: authUser.id, email: authUser.email, role: profile.is_admin ? 'admin' : 'user' });
    res.json({ token, user: { id: authUser.id, email: authUser.email, phone: authUser.phone }, profile });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await supabaseAdmin.from('users').update({ is_online: false, last_seen_at: new Date().toISOString() }).eq('id', req.userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
