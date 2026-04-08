import { describe, it, expect } from 'vitest';
import { REPO_MAP, FEEDBACK_TYPE_LABELS, FEEDBACK_TYPES } from '$lib/config';

describe('REPO_MAP', () => {
	it('maps buvis-gems to buvis/gems', () => {
		expect(REPO_MAP['buvis-gems']).toBe('buvis/gems');
	});

	it('returns undefined for unknown projects', () => {
		expect(REPO_MAP['unknown-project']).toBeUndefined();
	});
});

describe('FEEDBACK_TYPE_LABELS', () => {
	it('maps Bug Report to feedback and bug labels', () => {
		expect(FEEDBACK_TYPE_LABELS['Bug Report']).toEqual(['feedback', 'bug']);
	});

	it('maps Feature Request to feedback and enhancement labels', () => {
		expect(FEEDBACK_TYPE_LABELS['Feature Request']).toEqual(['feedback', 'enhancement']);
	});

	it('maps Other to feedback label only', () => {
		expect(FEEDBACK_TYPE_LABELS['Other']).toEqual(['feedback']);
	});
});

describe('FEEDBACK_TYPES', () => {
	it('contains all three feedback types', () => {
		expect(FEEDBACK_TYPES).toEqual(['Bug Report', 'Feature Request', 'Other']);
	});
});
