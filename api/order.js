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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await getUserFromRequest(req);
  if (!auth?.user?.id) return res.status(401).json({ error: 'Sign in required' });

  const { service, link, quantity } = req.body || {};
  const qty = Number(quantity);
  if (!service || typeof link !== 'string' || !link.trim() || !Number.isFinite(qty) || qty < 1) {
    return res.status(400).json({ error: 'Invalid order' });
  }

  try {
    const d = await provider({ action: 'add', service, link: link.trim(), quantity: Math.floor(qty) });
    if (!d.order) return res.status(502).json({ error: 'Provider did not return an order ID' });

    await supabaseRest('orders', {
      method: 'POST',
      token: auth.token,
      headers: { Prefer: 'return=minimal' },
      body: {
        user_id: auth.user.id,
        provider_order_id: String(d.order),
        service: String(service),
        link: link.trim(),
        quantity: Math.floor(qty),
        status: 'Pending',
        charge: d.charge ?? null
      }
    });
    return res.status(200).json({ order: d.order });
  } catch (e) {
    return res.status(502).json({ error: e?.message || 'Provider rejected order' });
  }
}
