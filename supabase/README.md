# Supabase Setup

## 1. Create buckets

In the Supabase dashboard → Storage, create two **private** buckets:

- `avatars`
- `renders`

## 2. Run the migration

In the SQL Editor, paste and run `migrations/0001_init.sql`.
Or via CLI:

```bash
supabase db push
```

## 3. Environment variables

Add to `backend/.env`:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_ANON_KEY=<anon_key>
```

The **service role key** is server-only — never send it to the frontend.
