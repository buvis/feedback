import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGitHubIssue, formatIssueBody, formatIssueTitle } from '$lib/github';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createGitHubIssue', () => {
	const validParams = {
		title: '[Bug Report] Widget crashes on click',
		body: 'Description of the bug',
		labels: ['feedback', 'bug'],
		repo: 'buvis/gems',
		token: 'ghp_test123'
	};

	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('sends POST to the correct GitHub API URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 201,
			json: () => Promise.resolve({ html_url: 'https://github.com/buvis/gems/issues/1' })
		});

		await createGitHubIssue(validParams);

		expect(mockFetch).toHaveBeenCalledOnce();
		const [url] = mockFetch.mock.calls[0];
		expect(url).toBe('https://api.github.com/repos/buvis/gems/issues');
	});

	it('sets Authorization header as Bearer token', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 201,
			json: () => Promise.resolve({ html_url: 'https://github.com/buvis/gems/issues/1' })
		});

		await createGitHubIssue(validParams);

		const [, options] = mockFetch.mock.calls[0];
		expect(options.headers['Authorization']).toBe('Bearer ghp_test123');
	});

	it('sets Accept header to GitHub JSON media type', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 201,
			json: () => Promise.resolve({ html_url: 'https://github.com/buvis/gems/issues/1' })
		});

		await createGitHubIssue(validParams);

		const [, options] = mockFetch.mock.calls[0];
		expect(options.headers['Accept']).toBe('application/vnd.github+json');
	});

	it('sends title, body, and labels in the request body', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 201,
			json: () => Promise.resolve({ html_url: 'https://github.com/buvis/gems/issues/1' })
		});

		await createGitHubIssue(validParams);

		const [, options] = mockFetch.mock.calls[0];
		const body = JSON.parse(options.body);
		expect(body.title).toBe(validParams.title);
		expect(body.body).toBe(validParams.body);
		expect(body.labels).toEqual(['feedback', 'bug']);
	});

	it('returns the html_url from a 201 response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 201,
			json: () =>
				Promise.resolve({ html_url: 'https://github.com/buvis/gems/issues/42' })
		});

		const url = await createGitHubIssue(validParams);

		expect(url).toBe('https://github.com/buvis/gems/issues/42');
	});

	it('throws on 401 unauthorized response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: () => Promise.resolve({ message: 'Bad credentials' })
		});

		await expect(createGitHubIssue(validParams)).rejects.toThrow('401');
	});

	it('throws on 403 forbidden response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 403,
			json: () => Promise.resolve({ message: 'Resource not accessible by integration' })
		});

		await expect(createGitHubIssue(validParams)).rejects.toThrow('403');
	});

	it('throws on 422 validation error response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 422,
			json: () =>
				Promise.resolve({ message: 'Validation Failed', errors: [{ code: 'invalid' }] })
		});

		await expect(createGitHubIssue(validParams)).rejects.toThrow('422');
	});

	it('throws on 500 server error response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: () => Promise.resolve({ message: 'Internal Server Error' })
		});

		await expect(createGitHubIssue(validParams)).rejects.toThrow('500');
	});

	it('includes status code and response detail in error message', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 403,
			json: () => Promise.resolve({ message: 'Resource not accessible by integration' })
		});

		await expect(createGitHubIssue(validParams)).rejects.toThrow(
			/403.*Resource not accessible by integration/
		);
	});

	it('handles non-JSON error responses gracefully', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 502,
			statusText: 'Bad Gateway',
			json: () => Promise.reject(new SyntaxError('Unexpected token'))
		});

		await expect(createGitHubIssue(validParams)).rejects.toThrow(/502.*Bad Gateway/);
	});
});

describe('formatIssueBody', () => {
	it('includes the description text in output', () => {
		const result = formatIssueBody({ description: 'The widget is broken' });

		expect(result).toContain('The widget is broken');
	});

	it('includes environment table with all provided values', () => {
		const result = formatIssueBody({
			description: 'Bug details',
			tool: 'bim',
			version: '1.2.3',
			os: 'macOS 15.4',
			python: '3.12.0'
		});

		expect(result).toContain('bim');
		expect(result).toContain('1.2.3');
		expect(result).toContain('macOS 15.4');
		expect(result).toContain('3.12.0');
	});

	it('includes feedback.buvis.net footer link', () => {
		const result = formatIssueBody({ description: 'Something' });

		expect(result).toContain('feedback.buvis.net');
	});

	it('handles missing optional fields gracefully', () => {
		const result = formatIssueBody({ description: 'Minimal report' });

		expect(result).toContain('Minimal report');
		expect(result).not.toContain('undefined');
		expect(result).not.toContain('null');
	});

	it('handles partially provided optional fields', () => {
		const result = formatIssueBody({
			description: 'Partial info',
			tool: 'dot'
		});

		expect(result).toContain('dot');
		expect(result).not.toContain('undefined');
		expect(result).not.toContain('null');
	});
});

describe('formatIssueTitle', () => {
	it('formats bug report title with bracket prefix', () => {
		expect(formatIssueTitle('Bug Report', 'My title')).toBe('[Bug Report] My title');
	});

	it('formats feature request title with bracket prefix', () => {
		expect(formatIssueTitle('Feature Request', 'Another title')).toBe(
			'[Feature Request] Another title'
		);
	});

	it('formats other type title with bracket prefix', () => {
		expect(formatIssueTitle('Other', 'Something')).toBe('[Other] Something');
	});
});
