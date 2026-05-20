import { Router } from 'express';
import { body } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.post(
  '/upload-url',
  [body('bucket').isIn(['chat-media', 'avatars']), body('path').isString().isLength({ min: 3, max: 500 })],
  validate,
  async (req, res, next) => {
    try {
      const { data, error } = await supabaseAdmin.storage.from(req.body.bucket).createSignedUploadUrl(req.body.path);
      if (error) throw error;
      res.json({ signedUrl: data.signedUrl, token: data.token, path: data.path });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  [
    body('chatId').optional().isUUID(),
    body('bucket').isString(),
    body('storagePath').isString(),
    body('publicUrl').isURL(),
    body('fileName').isString().isLength({ min: 1, max: 240 }),
    body('fileSize').isInt({ min: 1, max: 1024 * 1024 * 1024 }),
    body('mimeType').isString()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('media_files')
        .insert({
          chat_id: req.body.chatId || null,
          uploader_id: req.userId,
          bucket: req.body.bucket,
          storage_path: req.body.storagePath,
          public_url: req.body.publicUrl,
          file_name: req.body.fileName,
          file_size: req.body.fileSize,
          mime_type: req.body.mimeType
        })
        .select('*')
        .single();
      if (error) throw error;
      res.status(201).json({ media: data });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
