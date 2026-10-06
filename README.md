# BudgetApp — Phase 1

A free, multi-user budget tracker (Next.js + Supabase).

## 1. Create a free Supabase project
- Go to supabase.com, create a project (free tier).
- In the SQL editor, run `supabase/schema.sql` from this repo once.
- In Project Settings → API, copy the **Project URL** and **anon public key**.
- In Authentication → Providers, make sure **Email** is enabled, and under Email templates confirm the magic-link ("Confirm signup" / "Magic Link") sender is on (default on free tier).
- In Authentication → URL Configuration, add `http://localhost:3000/auth/callback` (and your production URL + `/auth/callback` once deployed) to Redirect URLs.

## 2. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in the two Supabase values from step 1.

## 3. Run locally
```
npm install
npm run dev
```
Open http://localhost:3000 — sign in with your email (magic link), complete the one-time setup wizard, and you're in.

## 4. Deploy (free)
- Push this repo to GitHub.
- Create a free Vercel account, import the repo.
- Add the same two environment variables in Vercel's project settings.
- Deploy — you'll get a live URL. Add `https://your-app.vercel.app/auth/callback` to Supabase's Redirect URLs too.

## What's built (Phase 1)
- Magic-link signup/login, one-time Setup Wizard (currency, income, categories)
- Log Expense — type-and-enter logging, instant totals
- Dashboard — KPIs, EMI tracker cards with auto end-date nudges, Budget Pace insight, expense breakdown
- Planned Budget — rolling 12-month forecast grid with EMI auto-cutoff and spend/save subtotals
- Historic — full ledger with category filter + CSV export
- Settings — edit income and categories any time

Not built yet (Phase 2/3/4 per the spec): overspend-pace/trend-arrow/recurring-spend insights, the "Ask Your Money" chatbot, PWA installability.
