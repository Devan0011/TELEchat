import { Router } from 'express';
import { body } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/ice-servers', (_req, res) => {
  const iceServers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] }];
  if (env.TURN_URL) {
    iceServers.push({ urls: env.TURN_URL, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL });
  }
  res.json({ iceServers });
});

router.post(
  '/history',
  [body('chatId').optional().isUUID(), body('peerId').isUUID(), body('type').isIn(['voice', 'video', 'screen']), body('status').isString()],
  validate,
  async (req, res, next) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('call_history')
        .insert({
          chat_id: req.body.chatId || null,
          caller_id: req.userId,
          callee_id: req.body.peerId,
          type: req.body.type,
          status: req.body.status,
          duration_seconds: req.body.durationSeconds || 0
        })
        .select('*')
        .single();
      if (error) throw error;
      res.status(201).json({ call: data });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
