# USK Background Swap

Vite + TanStack Start application. GitHub versions the application source, repository-local assets, and reviewed Supabase migrations. Supabase remains the source of truth for production data and media.

## Ownership and portability

- **GitHub:** application source, configuration, static assets in `public/` and `src/assets/`, and `supabase/migrations/`.
- **Supabase:** production database, existing records, the `usk-assets` Storage bucket and files, plus authentication if enabled.
- **v0:** development/editor and preview environment only.

The runtime has no dependency on a v0 Blob, Lovable Blob, temporary v0 asset, or account-specific image URL. The background fallback is the repository-local `/usk-official-background.png`; team logos and kit images resolve through the shared Supabase `usk-assets` bucket.

## Supabase environment variables

Configure these when importing this same repository into another v0 account:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

The first two support browser reads. The last two are required for server-side admin asset uploads. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never commit it.

## Application dependencies

The application reads or writes:

- `public.usk_teams`
- `public.usk_matches`
- `public.usk_live_states`
- `public.usk_official_kits`

It uses the `usk-assets` bucket with `teams/` and `kits/` path prefixes.

## Reproducing the real Supabase schema

The existing production Supabase project is the source of truth. The repository intentionally does not guess its schema, relations, functions, triggers, policies, or Storage configuration.

1. Export **schema-only SQL** from the existing production Supabase project, including tables, columns, constraints, indexes, functions, triggers, RLS enablement, policies, and Storage configuration/policies where applicable.
2. Review the export. Remove secrets, project-specific ownership statements, destructive commands, and all production data INSERT statements.
3. Save the reviewed export as the next ordered migration, for example `supabase/migrations/0002_production_schema.sql`.
4. Apply it only to a new/empty target project after review. Never reset, drop, truncate, or delete the existing production project.
5. Configure the environment variables above for the selected Supabase project.
6. If using a different Supabase project, migrate Storage files separately. Using the same project preserves the existing records and images automatically.

The exact CLI command depends on the Supabase CLI version and project reference; follow the official Supabase schema-dump workflow. Do not substitute guessed DDL. `0001_existing_schema_inventory.sql` is intentionally a safe, documentation-only migration and must remain in place.

## Portability files

- `.env.example` — required environment variable names
- `src/lib/supabase.ts` — Supabase client and Storage URL handling
- `src/lib/asset-upload.ts` — server-side asset uploads
- `src/lib/tenue-upload.ts` — server-side kit uploads
- `supabase/migrations/0001_existing_schema_inventory.sql` — verified dependency inventory
- `public/usk-official-background.png` and `public/usk-official-logo.png` — repository-local assets

Production records, Storage files, and authentication secrets are not stored in GitHub.

## Development

```sh
npm install
npm run dev
```

## Final portability status

A) **Yes:** the application source and runtime assets are portable between v0 accounts.

B) **Yes:** existing Supabase data and images are shared when both accounts configure the same Supabase project.

C) The remaining manual step is a reviewed, schema-only export of the real production schema, RLS policies, functions, triggers, and Storage configuration into the next migration. Do not export production data or use migrations destructively.

D) The portability configuration is in `.env.example`, `src/lib/supabase.ts`, the upload helpers, `supabase/migrations/0001_existing_schema_inventory.sql`, and the repository-local `public/` assets.

The existing production Supabase database and Storage were not modified.

This repository originated from Lovable, but Lovable editor metadata is not required by the application runtime. For v0 support, use [Vercel Help](https://vercel.com/help).
