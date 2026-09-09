// LIBRARIES
import { createContext } from 'svelte';

// TYPES
import type { Doc } from '@convex/_generated/dataModel.js';

export const [getOpenUpsells, setOpenUpsells] =
	createContext<
		(product: Pick<Doc<'products'>, '_id' | 'name'>, openCartIfEmpty: boolean) => void
	>();
