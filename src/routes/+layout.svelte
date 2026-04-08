<script>
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>buvis feedback</title>
	<meta name="description" content="Submit feedback for buvis CLI tools" />
</svelte:head>

<div class="shell">
	<header class="header">
		<a href="/" class="wordmark">
			<span class="wordmark-buvis">buvis</span>
			<span class="wordmark-sep">/</span>
			<span class="wordmark-feedback">feedback</span>
		</a>
	</header>

	<main class="main">
		{@render children()}
	</main>

	<footer class="footer">
		<p>
			Open source at
			<a href="https://github.com/buvis" target="_blank" rel="noopener">github.com/buvis</a>
		</p>
	</footer>
</div>

<style>
	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		max-width: 40rem;
		margin-inline: auto;
		padding-inline: var(--space-lg);
	}

	.header {
		padding-block: var(--space-lg);
		border-bottom: 0.0625rem solid var(--color-border);
	}

	.wordmark {
		font-family: var(--font-mono);
		font-size: var(--text-lg);
		font-weight: 500;
		text-decoration: none;
		color: var(--color-text);
		letter-spacing: -0.02em;
	}

	.wordmark:hover {
		color: var(--color-accent);
	}

	.wordmark-buvis {
		font-weight: 700;
	}

	.wordmark-sep {
		color: var(--color-text-muted);
		margin-inline: 0.15em;
	}

	.wordmark-feedback {
		color: var(--color-text-secondary);
	}

	.main {
		flex: 1;
		padding-block: var(--space-xl);
	}

	.footer {
		padding-block: var(--space-lg);
		border-top: 0.0625rem solid var(--color-border);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.footer a {
		color: var(--color-text-secondary);
	}
</style>
