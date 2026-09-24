<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// DATA
	import { AGE_GROUP_LABELS } from '@/features/products/data/productLabels.js';

	// TYPES
	import type { ProductAgeGroup } from '@/shared/features/products/types/productsTypes.js';

	let { value }: { value: ProductAgeGroup } = $props();
</script>

<Badge variant="secondary">{AGE_GROUP_LABELS[value]()}</Badge>
