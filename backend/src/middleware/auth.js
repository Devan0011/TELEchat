import { supabaseAdmin } from '../config/supabase.js';
import { verifyJwt } from '../utils/jwt.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing bearer token' });
    const decoded = verifyJwt(token);
    const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', decoded.sub).single();
    if (error || !data) return res.status(401).json({ message: 'User profile not found' });
    req.user = data;
    req.userId = decoded.sub;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ message: 'Admin access required' });
  return next();
}
