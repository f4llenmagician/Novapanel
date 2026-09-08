# NovaPanel — Supabase + Vercel build

This build uses Supabase Auth for persistent email/password accounts, Supabase Postgres for profiles/orders, and keeps the FanSMM provider key server-side.

## Vercel environment variable
- `FANSM_API_KEY` = provider API key

## Supabase URL configuration
Set your production Vercel domain as the Supabase **Site URL** and allow it in **Redirect URLs** (a wildcard such as `https://your-domain.vercel.app/**` is fine).

## Email confirmation UX
- After signup, NovaPanel displays a dedicated “Confirm your email” screen.
- After the user taps the Supabase confirmation link and returns to the Vercel site, NovaPanel displays an “Email confirmed” success screen.
- Confirmation tokens are immediately removed from the browser address bar before showing the success screen.
