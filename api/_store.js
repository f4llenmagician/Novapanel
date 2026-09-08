// Replace this simple in-memory store with Supabase/Postgres before production.
// It is intentionally not persistent across Vercel cold starts.
export const users = new Map();
export const sessions = new Map();
export const orders = new Map();
export const wallets = new Map();
export function auth(req){
  const h=req.headers.authorization||'';
  const token=h.startsWith('Bearer ')?h.slice(7):'';
  const email=sessions.get(token);
  return email||null;
}
