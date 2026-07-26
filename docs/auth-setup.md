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

This is the same pattern used by the Vexle project. Vexle does not configure a sender address in frontend code; its frontend only calls `supabase.auth.signUp(...)` with `emailRedirectTo`, and Supabase Auth decides how to send the confirmation or password reset email.

By default, Supabase sends auth emails through its built-in email service. Supabase's default sender is only suitable for testing and has strict limits. For production, configure custom SMTP in Supabase if you want messages to be delivered reliably and come from a domain email such as:

```text
no-reply@rngdle.org
```

## Recommended Production Sender Setup

Use a dedicated authentication sender, not your personal inbox:

```text
no-reply@rngdle.org
```

Recommended settings:

```text
Sender name: RNGdle
Sender email: no-reply@rngdle.org
Reply-to email: hello@rngdle.org
```

You need an SMTP provider for `rngdle.org`, for example Resend, Amazon SES, Postmark, SendGrid, ZeptoMail, Brevo, Zoho, or another provider that supports SMTP.

After choosing the provider:

1. Verify `rngdle.org` in the email provider.
2. Add the DNS records the provider gives you, usually SPF, DKIM, and sometimes DMARC.
3. Get SMTP credentials from the provider:

```text
SMTP host
SMTP port
SMTP username
SMTP password
From email
Sender name
```

Then configure Supabase:

```text
Supabase > Authentication > Settings > SMTP Settings
```

Enable custom SMTP and fill in:

```text
Host: provider SMTP host
Port: usually 587
Username: provider SMTP username
Password: provider SMTP password
Sender email: no-reply@rngdle.org
Sender name: RNGdle
```

Do not put SMTP username/password in Vercel frontend environment variables or frontend JavaScript. SMTP credentials belong only in Supabase's Auth SMTP settings or another trusted server-side system.

After saving SMTP settings, test:

1. Sign up with a non-team email address.
2. Confirm the email arrives.
3. Check that the From address shows `RNGdle <no-reply@rngdle.org>`.
4. Test reset password from the login dialog.

## Required Supabase Dashboard Settings

In Supabase, check:

- Authentication > Providers > Email: enable Email provider.
- Authentication > URL Configuration > Site URL: set the production URL, for example `https://www.rngdle.org`.
- Authentication > URL Configuration > Redirect URLs: add local and production URLs:

```text
http://localhost:5173
http://localhost:5174
https://www.rngdle.org
https://rngdle.org
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

Each value must be a single line. Do not paste multiple copies of the URL or key into the same Vercel variable. `SUPABASE_URL` should not include `/rest/v1`; use only the base project URL:

```text
https://your-project-ref.supabase.co
```

4. Apply them to `Production`, `Preview`, and `Development` as needed.
5. Redeploy after adding or changing environment variables.
