<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// DATA
	import { GENDER_LABELS } from '@/features/products/data/productLabels.js';

	// TYPES
	import type { ProductGender } from '@/shared/features/products/types/productsTypes.js';

	let { value }: { value: ProductGender } = $props();
</script>

<Badge variant="outline">{GENDER_LABELS[value]()}</Badge>
