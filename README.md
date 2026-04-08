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
npm run build            # production build
```

## Architecture

- `src/lib/config.ts` - project allowlist, label mappings
- `src/lib/github.ts` - GitHub Issues API client
- `src/routes/+page.svelte` - feedback form UI
- `src/routes/+page.server.ts` - form action (validation, Turnstile, issue creation)
