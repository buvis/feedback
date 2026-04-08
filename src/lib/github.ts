interface CreateIssueParams {
	title: string;
	body: string;
	labels: string[];
	repo: string;
	token: string;
}

interface FormatBodyParams {
	description: string;
	tool?: string;
	version?: string;
	os?: string;
	python?: string;
}

export async function createGitHubIssue(params: CreateIssueParams): Promise<string> {
	const { title, body, labels, repo, token } = params;

	const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'User-Agent': 'buvis-feedback',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ title, body, labels })
	});

	if (!response.ok) {
		let message = `status ${response.status}`;
		try {
			const error = await response.json();
			message = `${response.status}: ${error.message}`;
		} catch {
			message = `${response.status}: ${response.statusText}`;
		}
		throw new Error(`GitHub API error ${message}`);
	}

	const data = await response.json();
	return data.html_url;
}

export function formatIssueBody(params: FormatBodyParams): string {
	const { description, tool, version, os, python } = params;

	const envRows: string[] = [];
	if (tool) envRows.push(`| Tool | \`${tool}\` |`);
	if (version) envRows.push(`| Version | \`${version}\` |`);
	if (os) envRows.push(`| OS | \`${os}\` |`);
	if (python) envRows.push(`| Python | \`${python}\` |`);

	const envSection =
		envRows.length > 0
			? `\n## Environment\n\n| Property | Value |\n|----------|-------|\n${envRows.join('\n')}\n`
			: '';

	return `## Description\n\n${description}\n${envSection}\n---\n*Submitted via [feedback.buvis.net](https://feedback.buvis.net)*`;
}

export function formatIssueTitle(type: string, title: string): string {
	return `[${type}] ${title}`;
}
