# buvis/feedback

Feedback form for buvis CLI tools. SvelteKit app deployed on Cloudflare Pages.

Users arrive via `<tool> --feedback`, which opens this form with environment context pre-populated. Submissions create GitHub Issues on the relevant buvis repo.

## Development

```bash
cp .env.example .env     # fill in PUBLIC_TURNSTILE_SITE_KEY
npm install
npm run dev              # http://localhost:5173
npm run test             # vitest
npm run check            # svelte-check
```

## Deployment

### 1. Create Cloudflare Turnstile site

In [Cloudflare dashboard](https://dash.cloudflare.com/) -> Turnstile -> Add site. Use **Managed** widget mode. Note the **site key** and **secret key**.

### 2. Create GitHub PAT

Create a [fine-grained PAT](https://github.com/settings/personal-access-tokens/new) with Issues read/write permission on the target repo. Set expiry to 1 year.

### 3. Generate a bypass key

```bash
openssl rand -hex 32
```

### 4. Connect repo to Cloudflare Pages

In Cloudflare Pages, create a new project connected to this GitHub repo.

Build settings:
- Framework preset: **SvelteKit**
- Build command: `npm run build`
- Build output directory: `.svelte-kit/cloudflare`

### 5. Set environment variables

In Cloudflare Pages -> Settings -> Environment Variables:

| Variable | Type | Value |
|----------|------|-------|
| `PUBLIC_TURNSTILE_SITE_KEY` | Build-time (plaintext) | Site key from step 1 |
| `GITHUB_PAT` | Secret (encrypted) | PAT from step 2 |
| `TURNSTILE_SECRET_KEY` | Secret (encrypted) | Secret key from step 1 |
| `BYPASS_KEY` | Secret (encrypted) | Key from step 3 |

### 6. DNS

Add a CNAME record pointing your domain to `<project>.pages.dev`.

### 7. Verify

1. Open the deployed URL
2. Submit test feedback, check that a GitHub Issue is created
3. Test with bypass key in the Developer section (issue gets `accepted` label)
4. Test with URL params: `?project=buvis-gems&tool=test&version=1.0`

## Architecture

- `src/lib/config.ts` - project allowlist, label mappings
- `src/lib/github.ts` - GitHub Issues API client
- `src/routes/+page.svelte` - feedback form UI
- `src/routes/+page.server.ts` - form action (validation, Turnstile, issue creation)
