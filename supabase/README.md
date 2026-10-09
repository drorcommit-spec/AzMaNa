# Supabase setup

These steps provision the backend. They require your own Supabase project and
cannot be done by the code generator (they need your live project + secrets).

## 1. Create a project

Create a project at https://supabase.com and note from Project Settings -> API:

- Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
- `anon` public key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` secret key -> `SUPABASE_SERVICE_ROLE_KEY`

Copy `.env.example` to `.env` and fill these in.

## 2. Apply migrations

Run the SQL files in order in the Supabase SQL editor (or via the Supabase CLI):

1. `migrations/0001_init.sql` — tables and constraints
2. `migrations/0002_rls.sql` — row level security policies
3. `migrations/0003_storage.sql` — public event-images bucket

## 3. Seed admin accounts

There is no public signup. Create organizer logins with:

```
npm run seed
```

Set `ADMIN_SEED` env to a JSON array to customize, e.g.:

```
ADMIN_SEED=[{"email":"you@example.com","password":"a-strong-password"}]
```
