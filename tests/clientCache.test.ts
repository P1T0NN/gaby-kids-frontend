import { describe, expect, it } from 'vitest';

import { createClientCache } from '../src/lib/clientCache/clientCache.js';

describe('createClientCache', () => {
	it('evicts the least recently used entry and clears snapshots', () => {
		const cache = createClientCache<number>(2);

		cache.set('first', 1);
		cache.set('second', 2);
		expect(cache.get('first')).toBe(1);

		cache.set('third', 3);
		expect(cache.get('second')).toBeUndefined();

		cache.clear();
		expect(cache.get('first')).toBeUndefined();
		expect(cache.get('third')).toBeUndefined();
	});
});
