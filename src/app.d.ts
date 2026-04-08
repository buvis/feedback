/// <reference types="@sveltejs/kit" />
/// <reference types="@sveltejs/adapter-cloudflare" />

declare global {
	namespace App {
		interface Platform {
			env: {
				GITHUB_PAT: string;
				TURNSTILE_SECRET_KEY: string;
				BYPASS_KEY: string;
			};
		}
	}
}

export {};
