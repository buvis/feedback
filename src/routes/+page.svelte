<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { FEEDBACK_TYPES } from '$lib/config';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';

	let { form } = $props();

	const params = $derived({
		project: page.url.searchParams.get('project') ?? '',
		tool: page.url.searchParams.get('tool') ?? '',
		version: page.url.searchParams.get('version') ?? '',
		os: page.url.searchParams.get('os') ?? '',
		python: page.url.searchParams.get('python') ?? ''
	});

	const hasContext = $derived(
		params.project || params.tool || params.version || params.os || params.python
	);

	let devOpen = $state(false);
	let submitting = $state(false);
	let turnstileContainer = $state<HTMLDivElement>();

	function resetTurnstile() {
		if (typeof window !== 'undefined' && 'turnstile' in window && turnstileContainer) {
			const turnstile = window.turnstile as { reset: (el: HTMLElement) => void };
			turnstile.reset(turnstileContainer);
		}
	}
</script>

{#if form?.success}
	<div class="result result-success">
		<h1>Feedback submitted</h1>
		<p>
			Your feedback has been recorded. You can track it at
			<a href={form.issueUrl} target="_blank" rel="noopener">{form.issueUrl}</a>.
		</p>
		<a href="/" class="btn btn-secondary">Submit another</a>
	</div>
{:else}
	<div class="page">
		<div class="intro">
			<h1>Send feedback</h1>
			<p class="subtitle">
				Report a bug, request a feature, or share your thoughts about buvis tools.
			</p>
		</div>

		{#if hasContext}
			<div class="context-bar">
				<span class="context-label">Environment</span>
				<div class="badges">
					{#if params.tool}
						<span class="badge">{params.tool}</span>
					{/if}
					{#if params.version}
						<span class="badge badge-dim">v{params.version}</span>
					{/if}
					{#if params.os}
						<span class="badge badge-dim">{params.os}</span>
					{/if}
					{#if params.python}
						<span class="badge badge-dim">Python {params.python}</span>
					{/if}
					{#if params.project}
						<span class="badge badge-accent">{params.project}</span>
					{/if}
				</div>
			</div>
		{:else}
			<div class="context-bar context-bar-empty">
				<p>
					Normally you'd arrive here from a buvis CLI tool via <code>--feedback</code>.
					You can still submit feedback manually.
				</p>
			</div>
		{/if}

		{#if form?.error}
			<div class="result result-error" role="alert">
				<p>{form.error}</p>
			</div>
		{/if}

		<form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; resetTurnstile(); }; }} class="form">
			<input type="hidden" name="project" value={params.project} />
			<input type="hidden" name="tool" value={params.tool} />
			<input type="hidden" name="version" value={params.version} />
			<input type="hidden" name="os" value={params.os} />
			<input type="hidden" name="python" value={params.python} />

			<div class="field">
				<label for="type" class="label">Type</label>
				<select id="type" name="type" class="select" required>
					{#each FEEDBACK_TYPES as t}
						<option value={t} selected={form?.type === t}>{t}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="title" class="label">Title</label>
				<input
					id="title"
					name="title"
					type="text"
					class="input"
					required
					maxlength="200"
					placeholder="Short summary of your feedback"
					value={form?.title ?? ''}
				/>
				<span class="hint">Max 200 characters</span>
			</div>

			<div class="field">
				<label for="description" class="label">Description</label>
				<textarea
					id="description"
					name="description"
					class="textarea"
					required
					maxlength="5000"
					rows="6"
					placeholder="Describe what happened, what you expected, or what you'd like to see"
				>{form?.description ?? ''}</textarea>
				<span class="hint">Max 5000 characters</span>
			</div>

			<div class="turnstile-container" bind:this={turnstileContainer}>
				<div
					class="cf-turnstile"
					data-sitekey={PUBLIC_TURNSTILE_SITE_KEY}
					data-theme="light"
				></div>
			</div>

			<details class="dev-section" bind:open={devOpen}>
				<summary class="dev-toggle">Developer</summary>
				<div class="field">
					<label for="key" class="label">Bypass key</label>
					<input
						id="key"
						name="key"
						type="password"
						class="input input-mono"
						autocomplete="off"
					/>
				</div>
			</details>

			<button type="submit" class="btn btn-primary" disabled={submitting}>
				{submitting ? 'Submitting...' : 'Submit feedback'}
			</button>
		</form>

		<div class="privacy">
			<h2>Privacy</h2>
			<p>
				This form collects your feedback title, description, and the environment
				details shown above (tool name, version, OS, Python version). Your submission
				creates a <strong>public</strong> GitHub Issue on the
				<a href="https://github.com/buvis/gems" target="_blank" rel="noopener">buvis/gems</a>
				repository. No personal data is collected unless you include it in your description.
			</p>
		</div>
	</div>
{/if}

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.intro {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	h1 {
		font-size: var(--text-2xl);
		font-weight: 700;
		line-height: var(--leading-tight);
		letter-spacing: -0.03em;
	}

	.subtitle {
		font-size: var(--text-lg);
		color: var(--color-text-secondary);
		line-height: var(--leading-relaxed);
	}

	/* Context bar */
	.context-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: var(--color-surface);
		border: 0.0625rem solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.context-bar-empty {
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
	}

	.context-bar-empty code {
		background: var(--color-surface-dim);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
	}

	.context-label {
		font-size: var(--text-xs);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.badge {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 500;
		padding: 0.1875rem var(--space-sm);
		border-radius: var(--radius-pill);
		background: var(--color-surface-dim);
		color: var(--color-text);
		border: 0.0625rem solid var(--color-border);
	}

	.badge-dim {
		color: var(--color-text-secondary);
	}

	.badge-accent {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
		border-color: oklch(55% 0.15 195 / 0.2);
	}

	/* Form */
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.label {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text);
	}

	.input,
	.textarea,
	.select {
		font-family: var(--font-body);
		font-size: var(--text-base);
		padding: 0.625rem 0.75rem;
		border: 0.0625rem solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		transition:
			border-color var(--duration-fast) var(--ease-out),
			box-shadow var(--duration-fast) var(--ease-out);
	}

	.input:focus,
	.textarea:focus,
	.select:focus {
		outline: none;
		border-color: var(--color-border-focus);
		box-shadow: var(--shadow-focus);
	}

	.input::placeholder,
	.textarea::placeholder {
		color: var(--color-text-muted);
	}

	.input-mono {
		font-family: var(--font-mono);
	}

	.textarea {
		resize: vertical;
		min-height: 8rem;
	}

	.select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		padding-right: 2.25rem;
	}

	.hint {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.turnstile-container {
		min-height: 1.5rem;
	}

	/* Developer section */
	.dev-section {
		border: 0.0625rem solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
	}

	.dev-toggle {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		user-select: none;
	}

	.dev-toggle:hover {
		color: var(--color-text-secondary);
	}

	.dev-section[open] .dev-toggle {
		margin-bottom: var(--space-md);
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: 500;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		text-decoration: none;
		transition:
			background-color var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
	}

	.btn:active {
		transform: scale(0.98);
	}

	.btn-primary {
		background: var(--color-accent);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-accent-hover);
	}

	.btn-primary:focus-visible {
		outline: 0.125rem solid var(--color-border-focus);
		outline-offset: 0.125rem;
	}

	.btn-secondary {
		background: var(--color-surface-dim);
		color: var(--color-text);
		border: 0.0625rem solid var(--color-border);
	}

	.btn-secondary:hover {
		background: var(--color-border);
	}

	/* Result messages */
	.result {
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
	}

	.result-success {
		background: var(--color-success-bg);
		border: 0.0625rem solid var(--color-success);
	}

	.result-success h1 {
		font-size: var(--text-xl);
		color: var(--color-success);
		margin-bottom: var(--space-sm);
	}

	.result-success a:first-of-type {
		word-break: break-all;
	}

	.result-success .btn {
		margin-top: var(--space-md);
	}

	.result-error {
		background: var(--color-error-bg);
		border: 0.0625rem solid var(--color-error);
		color: var(--color-error);
		font-weight: 500;
	}

	/* Privacy */
	.privacy {
		padding-top: var(--space-xl);
		border-top: 0.0625rem solid var(--color-border);
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: var(--leading-relaxed);
	}

	.privacy h2 {
		font-size: var(--text-sm);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		margin-bottom: var(--space-sm);
	}
</style>
