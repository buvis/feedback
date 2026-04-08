# buvis/feedback

Feedback form for buvis CLI tools. SvelteKit app deployed on Cloudflare Pages.

Users arrive via `<tool> --feedback`, which opens this form with environment context pre-populated. Submissions create GitHub Issues on the relevant buvis repo.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run test         # vitest
npm run check        # svelte-check
npm run build        # production build
```

## Deployment

### 1. Cloudflare Turnstile

Create a Turnstile site in [Cloudflare dashboard](https://dash.cloudflare.com/) (managed mode). Note the site key and secret key.

Update `TURNSTILE_SITE_KEY` in `src/lib/config.ts` with the real site key.

### 2. GitHub PAT

Create a [fine-grained PAT](https://github.com/settings/personal-access-tokens/new) with:
- Repository access: `buvis/gems`
- Permissions: Issues (Read and write)
- Expiry: 1 year (set a calendar reminder to renew)

### 3. Cloudflare Pages

```bash
npx wrangler pages project create buvis-feedback
npx wrangler pages secret put GITHUB_PAT
npx wrangler pages secret put TURNSTILE_SECRET_KEY
npx wrangler pages secret put BYPASS_KEY
npx wrangler pages deploy .svelte-kit/cloudflare --project-name buvis-feedback
```

### 4. DNS

Add a CNAME record: `feedback.buvis.net` pointing to `buvis-feedback.pages.dev`.

## Architecture

- `src/lib/config.ts` - project allowlist, Turnstile key, label mappings
- `src/lib/github.ts` - GitHub Issues API client
- `src/routes/+page.svelte` - feedback form UI
- `src/routes/+page.server.ts` - form action (validation, Turnstile, issue creation)

## Secrets

| Name | Purpose |
|------|---------|
| `GITHUB_PAT` | Fine-grained PAT for creating issues |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile verification |
| `BYPASS_KEY` | Developer key to skip triage (adds `accepted` label) |
