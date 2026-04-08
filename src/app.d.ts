/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Platform {
			env: {
				GITHUB_PAT: string;
				TURNSTILE_SECRET_KEY: string;
				BYPASS_KEY: string;
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
		}
	}
}

export {};
