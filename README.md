# CampusMart

A marketplace where students buy and sell on campus: textbooks, gadgets, hostel items, food and services. Buyers contact sellers on WhatsApp with one tap.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Storage-3ecf8e)

## Features

- Browse without an account; sign in only to sell
- **Full-text search** with weighted ranking (title > description) via a generated `tsvector` column and a GIN index
- Filter by category and maximum price
- Image uploads to Supabase Storage, validated for type and size on the server
- One-tap **WhatsApp contact** with a pre-filled message, normalising `0803…` to `234803…`
- Sellers can mark items sold, relist or delete them (which also removes the image)

## Security

- RLS: anyone can read listings; only the seller can change their own
- Storage policies only let a user write inside a folder named after their user id (`<uid>/file.webp`), so nobody can overwrite another seller's images
- Search input is sanitised before reaching `websearch_to_tsquery`

## Run it

```bash
# run supabase/schema.sql in your Supabase project (creates the table, index, bucket and policies)
cp .env.example .env.local
npm install && npm run dev
```

## Database schema

All tables live in their own Postgres schema, `campusmart`, rather than `public`, so this app can share one Supabase project with my other demo apps. After running `supabase/schema.sql`, add `campusmart` under **Supabase → Project Settings → Data API → Exposed schemas**. The app selects it through `db: { schema }` in `src/lib/supabase/config.ts`.
