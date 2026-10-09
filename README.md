# AzMaNa

Private event invitation platform. Admins create events and guest lists;
guests open a personal link to view a localized (Hebrew/English) invitation and
RSVP with their party size.

Built with Next.js (App Router) + Supabase (Postgres, Auth, Storage).

## Local development

1. Copy `.env.example` to `.env` and fill in your Supabase values.
2. Apply the SQL in `supabase/migrations/` (see `supabase/README.md`).
3. Seed an admin: `npm run seed`.
4. `npm install` then `npm run dev`, open http://localhost:3000.

## Deployment

Deployed on Vercel. Set the same environment variables as `.env` in the Vercel
project settings, with `NEXT_PUBLIC_SITE_URL` set to the deployed domain so
invite links are generated with the correct base URL.
