# AGENTS.md

Feedback form for buvis CLI tools. SvelteKit app deployed on Cloudflare Pages.

## Quick Start

```bash
npm install
npm run dev          # local dev server
npm run build        # production build (adapter-cloudflare)
npm run check        # TypeScript check
npm run test         # Vitest unit tests
```

## Architecture

```text
src/
├── lib/
│   ├── config.ts          # REPO_MAP, TURNSTILE_SITE_KEY, label mappings
│   └── github.ts          # GitHub Issues API client
├── routes/
│   ├── +layout.svelte     # App shell
│   ├── +page.svelte       # Feedback form UI
│   └── +page.server.ts    # Form action (validation, Turnstile, issue creation)
├── app.html               # HTML template
├── app.css                # Global styles and design tokens
└── app.d.ts               # Cloudflare platform env types
```

## Conventions

- Svelte 5 with runes
- TypeScript strict mode
- CSS custom properties for all design tokens
- No Tailwind - hand-written CSS
- Vitest for unit tests
- Progressive enhancement via SvelteKit `use:enhance`

## Cloudflare Secrets

- `GITHUB_PAT` - fine-grained PAT with Issues write on buvis/gems
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret
- `BYPASS_KEY` - developer bypass key for skipping triage

## Deployment

Cloudflare Pages with `@sveltejs/adapter-cloudflare`. DNS: `feedback.buvis.net`.
