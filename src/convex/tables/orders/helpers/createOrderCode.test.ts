import { describe, expect, it } from 'vitest';
import { createOrderCode } from './createOrderCode.js';

describe('createOrderCode', () => {
	it('creates a six-character code without ambiguous characters', () => {
		expect(createOrderCode(() => 0)).toBe('222222');
		expect(createOrderCode(() => 0.999)).toBe('ZZZZZZ');
	});
});
