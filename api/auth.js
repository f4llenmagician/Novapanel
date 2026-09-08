import { supabaseAuth } from './_supabase.js';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, password } = req.body || {};
  const email = normalizeEmail(req.body?.email);
  if (!email || !email.includes('@') || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Valid email and password (6+ chars) required' });
  }

  try {
    if (action === 'register') {
      const data = await supabaseAuth('signup', { method: 'POST', body: { email, password } });
      return res.status(201).json({
        ok: true,
        needsConfirmation: !data?.access_token,
        message: data?.access_token ? 'Account created.' : 'Account created. Check your email to confirm it, then sign in.'
      });
    }

    if (action === 'login') {
      const data = await supabaseAuth('token?grant_type=password', { method: 'POST', body: { email, password } });
      if (!data?.access_token) return res.status(401).json({ error: 'Sign in failed' });
      return res.status(200).json({ session: data.access_token });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    const status = Number(e?.status) || 400;
    return res.status(status >= 400 && status < 500 ? status : 500).json({ error: e?.message || 'Authentication failed' });
  }
}
