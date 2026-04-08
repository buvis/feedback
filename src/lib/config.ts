export const REPO_MAP: Record<string, string> = {
	'buvis-gems': 'buvis/gems'
};

export const TURNSTILE_SITE_KEY = '0x4AAAAAAA_PLACEHOLDER_KEY';

export const FEEDBACK_TYPE_LABELS: Record<string, string[]> = {
	'Bug Report': ['feedback', 'bug'],
	'Feature Request': ['feedback', 'enhancement'],
	Other: ['feedback']
};

export const FEEDBACK_TYPES = ['Bug Report', 'Feature Request', 'Other'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
