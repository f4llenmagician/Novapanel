import { getUserFromRequest, supabaseRest } from './_supabase.js';

const API = 'https://fansmm.in/api/v2';

async function provider(body) {
  const key = process.env.FANSM_API_KEY;
  if (!key) throw new Error('FANSM_API_KEY is not configured');
  const form = new URLSearchParams();
  form.set('key', key);
  for (const [name, value] of Object.entries(body)) {
    if (value !== undefined && value !== null) form.set(name, String(value));
  }
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`Provider request failed (${r.status})`);
  if (!data) throw new Error('Provider returned an invalid response');
  if (data.error) throw new Error(String(data.error));
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await getUserFromRequest(req);
  if (!auth?.user?.id) return res.status(401).json({ error: 'Sign in required' });

  try {
    const [services, profiles, orders] = await Promise.all([
      provider({ action: 'services' }),
      supabaseRest(`profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=balance`, { token: auth.token }),
      supabaseRest(`orders?user_id=eq.${encodeURIComponent(auth.user.id)}&select=id,provider_order_id,service,service_name,quantity,status,charge,created_at&order=created_at.desc`, { token: auth.token })
    ]);
    const balance = Number(profiles?.[0]?.balance || 0);
    const mine = (orders || []).map(o => ({ ...o, id: o.provider_order_id || o.id }));
    return res.status(200).json({ services, balance, orders: mine });
  } catch (e) {
    return res.status(502).json({ error: e?.message || 'Panel request failed' });
  }
}
