const DEFAULT_URL = 'https://kfnehzcqfnhrrdatvope.supabase.co';
const DEFAULT_KEY = 'sb_publishable_BOELzJKntY9MFewFfv4qhg_Rr1Vyhus';

export const SUPABASE_URL = process.env.SUPABASE_URL || DEFAULT_URL;
export const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_KEY;

export async function supabaseAuth(path, { method = 'GET', body, token } = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json'
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || `Supabase auth failed (${r.status})`;
    const err = new Error(String(message));
    err.status = r.status;
    throw err;
  }
  return data;
}

export async function getUserFromRequest(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return null;
  try {
    const user = await supabaseAuth('user', { token });
    return { user, token };
  } catch {
    return null;
  }
}

export async function supabaseRest(path, { method = 'GET', body, token, headers: extra = {} } = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
    ...extra
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) {
    const message = data?.message || data?.hint || data?.details || `Supabase database request failed (${r.status})`;
    const err = new Error(String(message));
    err.status = r.status;
    throw err;
  }
  return data;
}
