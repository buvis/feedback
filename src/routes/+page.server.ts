import { fail } from '@sveltejs/kit';
import { REPO_MAP, FEEDBACK_TYPE_LABELS } from '$lib/config';
import { createGitHubIssue, formatIssueBody, formatIssueTitle } from '$lib/github';
import type { Actions } from './$types';

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ secret, response: token })
	});

	if (!response.ok) return false;

	const result = await response.json();
	return result.success === true;
}

export const actions = {
	default: async ({ request, platform }) => {
		const data = await request.formData();

		const type = data.get('type') as string | null;
		const title = data.get('title') as string | null;
		const description = data.get('description') as string | null;
		const project = data.get('project') as string | null;
		const tool = (data.get('tool') as string) || undefined;
		const version = (data.get('version') as string) || undefined;
		const os = (data.get('os') as string) || undefined;
		const python = (data.get('python') as string) || undefined;
		const turnstileToken = data.get('cf-turnstile-response') as string | null;
		const bypassKey = (data.get('key') as string) || undefined;

		if (!type || !title || !description) {
			return fail(400, {
				error: 'Please fill in all required fields.',
				title: title ?? '',
				description: description ?? ''
			});
		}

		if (title.length > 200) {
			return fail(400, {
				error: 'Title must be 200 characters or fewer.',
				title,
				description
			});
		}

		if (description.length > 5000) {
			return fail(400, {
				error: 'Description must be 5000 characters or fewer.',
				title,
				description
			});
		}

		if (project && !REPO_MAP[project]) {
			return fail(400, {
				error: 'Unknown project.',
				title,
				description
			});
		}

		const env = platform?.env;
		if (!env) {
			return fail(500, {
				error: 'Server configuration error. Please try again later.',
				title,
				description
			});
		}

		if (!turnstileToken || !(await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY))) {
			return fail(403, {
				error: 'Verification failed. Please try again.',
				title,
				description
			});
		}

		const repo = project ? REPO_MAP[project] : 'buvis/gems';
		const labels = [...(FEEDBACK_TYPE_LABELS[type] ?? ['feedback'])];

		if (bypassKey && env.BYPASS_KEY && bypassKey === env.BYPASS_KEY) {
			labels.push('accepted');
		}

		const issueTitle = formatIssueTitle(type, title);
		const issueBody = formatIssueBody({ description, tool, version, os, python });

		try {
			const issueUrl = await createGitHubIssue({
				title: issueTitle,
				body: issueBody,
				labels,
				repo,
				token: env.GITHUB_PAT
			});

			return { success: true, issueUrl };
		} catch {
			return fail(500, {
				error: 'Could not create issue. Please try again later.',
				title,
				description
			});
		}
	}
} satisfies Actions;
