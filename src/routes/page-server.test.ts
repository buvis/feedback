import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeFormData(fields: Record<string, string>): FormData {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		form.append(key, value);
	}
	return form;
}

function makeEvent(fields: Record<string, string>, envOverrides?: Record<string, string>) {
	const formData = makeFormData(fields);
	return {
		request: {
			formData: () => Promise.resolve(formData)
		},
		platform: {
			env: {
				GITHUB_PAT: 'ghp_test',
				TURNSTILE_SECRET_KEY: 'ts_secret',
				BYPASS_KEY: 'dev_key_123',
				...envOverrides
			}
		}
	} as Parameters<typeof actions.default>[0];
}

const validFields = {
	type: 'Bug Report',
	title: 'Widget crashes',
	description: 'When I click the button it crashes',
	project: 'buvis-gems',
	tool: 'bim',
	version: '1.0.0',
	os: 'macOS 15.4',
	python: '3.12.0',
	'cf-turnstile-response': 'valid_token'
};

function mockTurnstileSuccess() {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: () => Promise.resolve({ success: true })
	});
}

function mockTurnstileFailure() {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: () => Promise.resolve({ success: false })
	});
}

function mockGitHubSuccess(url = 'https://github.com/buvis/gems/issues/99') {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		status: 201,
		json: () => Promise.resolve({ html_url: url })
	});
}

function mockGitHubFailure() {
	mockFetch.mockResolvedValueOnce({
		ok: false,
		status: 500,
		json: () => Promise.resolve({ message: 'Internal Server Error' })
	});
}

describe('form action', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	describe('validation', () => {
		it('rejects submission with missing title', async () => {
			const event = makeEvent({ ...validFields, title: '' });
			const result = await actions.default(event);

			expect(result).toHaveProperty('status', 400);
			expect(result).toHaveProperty('data.error', 'Please fill in all required fields.');
		});

		it('rejects submission with missing description', async () => {
			const event = makeEvent({ ...validFields, description: '' });
			const result = await actions.default(event);

			expect(result).toHaveProperty('status', 400);
		});

		it('rejects submission with missing type', async () => {
			const event = makeEvent({ ...validFields, type: '' });
			const result = await actions.default(event);

			expect(result).toHaveProperty('status', 400);
		});

		it('rejects title longer than 200 characters', async () => {
			const event = makeEvent({ ...validFields, title: 'x'.repeat(201) });
			const result = await actions.default(event);

			expect(result).toHaveProperty('status', 400);
			expect(result).toHaveProperty('data.error', 'Title must be 200 characters or fewer.');
		});

		it('rejects description longer than 5000 characters', async () => {
			const event = makeEvent({ ...validFields, description: 'x'.repeat(5001) });
			const result = await actions.default(event);

			expect(result).toHaveProperty('status', 400);
			expect(result).toHaveProperty(
				'data.error',
				'Description must be 5000 characters or fewer.'
			);
		});

		it('rejects unknown project', async () => {
			const event = makeEvent({ ...validFields, project: 'unknown-project' });
			const result = await actions.default(event);

			expect(result).toHaveProperty('status', 400);
			expect(result).toHaveProperty('data.error', 'Unknown project.');
		});

		it('preserves title and description in validation error response', async () => {
			const event = makeEvent({ ...validFields, project: 'bad' });
			const result = await actions.default(event);

			expect(result).toHaveProperty('data.title', validFields.title);
			expect(result).toHaveProperty('data.description', validFields.description);
		});
	});

	describe('turnstile verification', () => {
		it('rejects submission with missing turnstile token', async () => {
			const fields = { ...validFields };
			delete (fields as Record<string, string>)['cf-turnstile-response'];
			const event = makeEvent(fields);
			const result = await actions.default(event);

			expect(result).toHaveProperty('status', 403);
			expect(result).toHaveProperty('data.error', 'Verification failed. Please try again.');
		});

		it('rejects submission when turnstile verification fails', async () => {
			mockTurnstileFailure();
			const event = makeEvent(validFields);
			const result = await actions.default(event);

			expect(result).toHaveProperty('status', 403);
		});

		it('sends turnstile token to siteverify API', async () => {
			mockTurnstileSuccess();
			mockGitHubSuccess();
			const event = makeEvent(validFields);
			await actions.default(event);

			const [url, options] = mockFetch.mock.calls[0];
			expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
			expect(options.method).toBe('POST');
		});
	});

	describe('issue creation', () => {
		it('creates GitHub issue and returns URL on success', async () => {
			mockTurnstileSuccess();
			mockGitHubSuccess('https://github.com/buvis/gems/issues/42');
			const event = makeEvent(validFields);
			const result = await actions.default(event);

			expect(result).toEqual({
				success: true,
				issueUrl: 'https://github.com/buvis/gems/issues/42'
			});
		});

		it('returns 500 when GitHub API fails', async () => {
			mockTurnstileSuccess();
			mockGitHubFailure();
			const event = makeEvent(validFields);
			const result = await actions.default(event);

			expect(result).toHaveProperty('status', 500);
			expect(result).toHaveProperty(
				'data.error',
				'Could not create issue. Please try again later.'
			);
		});

		it('defaults to buvis/gems when no project specified', async () => {
			mockTurnstileSuccess();
			mockGitHubSuccess();
			const fields = { ...validFields, project: '' };
			const event = makeEvent(fields);
			await actions.default(event);

			const [githubUrl] = mockFetch.mock.calls[1];
			expect(githubUrl).toBe('https://api.github.com/repos/buvis/gems/issues');
		});
	});

	describe('bypass key', () => {
		it('adds accepted label when bypass key matches', async () => {
			mockTurnstileSuccess();
			mockGitHubSuccess();
			const event = makeEvent({ ...validFields, key: 'dev_key_123' });
			await actions.default(event);

			const [, options] = mockFetch.mock.calls[1];
			const body = JSON.parse(options.body);
			expect(body.labels).toContain('accepted');
		});

		it('does not add accepted label when bypass key is wrong', async () => {
			mockTurnstileSuccess();
			mockGitHubSuccess();
			const event = makeEvent({ ...validFields, key: 'wrong_key' });
			await actions.default(event);

			const [, options] = mockFetch.mock.calls[1];
			const body = JSON.parse(options.body);
			expect(body.labels).not.toContain('accepted');
		});

		it('does not add accepted label when bypass key is absent', async () => {
			mockTurnstileSuccess();
			mockGitHubSuccess();
			const event = makeEvent(validFields);
			await actions.default(event);

			const [, options] = mockFetch.mock.calls[1];
			const body = JSON.parse(options.body);
			expect(body.labels).not.toContain('accepted');
		});
	});

	describe('labels', () => {
		it('applies feedback and bug labels for bug reports', async () => {
			mockTurnstileSuccess();
			mockGitHubSuccess();
			const event = makeEvent(validFields);
			await actions.default(event);

			const [, options] = mockFetch.mock.calls[1];
			const body = JSON.parse(options.body);
			expect(body.labels).toEqual(['feedback', 'bug']);
		});

		it('applies feedback and enhancement labels for feature requests', async () => {
			mockTurnstileSuccess();
			mockGitHubSuccess();
			const event = makeEvent({ ...validFields, type: 'Feature Request' });
			await actions.default(event);

			const [, options] = mockFetch.mock.calls[1];
			const body = JSON.parse(options.body);
			expect(body.labels).toEqual(['feedback', 'enhancement']);
		});

		it('applies feedback label only for other type', async () => {
			mockTurnstileSuccess();
			mockGitHubSuccess();
			const event = makeEvent({ ...validFields, type: 'Other' });
			await actions.default(event);

			const [, options] = mockFetch.mock.calls[1];
			const body = JSON.parse(options.body);
			expect(body.labels).toEqual(['feedback']);
		});
	});
});
