# RNGdle Auth Setup

RNGdle uses Supabase Auth, matching the Vexle implementation.

## Frontend Config

RNGdle does not hard-code Supabase credentials in source files. The static build reads these environment variables:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

The build also accepts these aliases:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_PUBLISHABLE_KEY
```

These values are injected into the generated HTML at build time as `window.RNGDLE_SUPABASE_CONFIG`.

Important: the Supabase anon/publishable key is a browser key, so it will still be visible in the generated frontend bundle. Do not use a `service_role`, `secret`, database password, or direct Postgres URL in frontend code or frontend environment variables.

## Where to Find the Supabase Values

In the current Supabase dashboard:

- Find the URL at `Integrations > Data API`. Supabase may call it `API URL` instead of `Project URL`.
- Find the browser-safe key at `Settings > API Keys`. Use the `anon` or `publishable` key.

The URL should look like:

```text
https://your-project-ref.supabase.co
```

## Database

Run this SQL in the Supabase SQL editor:

```text
docs/supabase-auth.sql
```

This creates:

- `auth.users`: managed by Supabase automatically.
- `public.profiles`: app profile rows keyed by `auth.users.id`.

RNGdle currently does not upload roll scores. Daily roll, lifetime EP, and badges are still stored in browser `localStorage`.

## Email Registration

Email/password registration is handled by Supabase Auth:

- The user enters their own email address in the RNGdle sign-up dialog.
- Supabase creates the auth user.
- If email confirmation is enabled in Supabase, Supabase sends the confirmation email.
- Password reset emails are also sent by Supabase.

By default, Supabase sends auth emails through its built-in email service. For production, configure custom SMTP in Supabase if you want the messages to come from a domain email such as:

```text
hello@rngdle.com
```

## Required Supabase Dashboard Settings

In Supabase, check:

- Authentication > Providers > Email: enable Email provider.
- Authentication > URL Configuration > Site URL: set the production URL, for example `https://www.rngdle.com`.
- Authentication > URL Configuration > Redirect URLs: add local and production URLs:

```text
http://localhost:5173
http://localhost:5174
https://www.rngdle.com
https://rngdle.com
```

For Google login, also enable Authentication > Providers > Google and add the OAuth credentials there. If Google is not configured, email/password sign-up still works.

## Vercel Environment Variables

In Vercel:

1. Open the RNGdle project.
2. Go to `Settings > Environment Variables`.
3. Add:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

4. Apply them to `Production`, `Preview`, and `Development` as needed.
5. Redeploy after adding or changing environment variables.
