/// <reference types="@sveltejs/kit" />

// Note: we don't reference @sveltejs/adapter-cloudflare because it declares
// env: unknown which conflicts with our specific env type during interface
// merging. Instead we import Cloudflare types directly.

declare global {
	namespace App {
		interface Platform {
			env: {
				GITHUB_PAT: string;
				TURNSTILE_SECRET_KEY: string;
				BYPASS_KEY?: string;
			};
			ctx: import('@cloudflare/workers-types').ExecutionContext;
			caches: CacheStorage;
			cf?: import('@cloudflare/workers-types').IncomingRequestCfProperties;
		}
	}
}

export {};
