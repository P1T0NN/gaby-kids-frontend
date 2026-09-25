<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import HeroSection from '@/components/pages/(unprotected)/root/hero-section.svelte';
	import CategorySection from '@/components/pages/(unprotected)/root/category-section/category-section.svelte';
	import OccasionsSection from '@/components/pages/(unprotected)/root/occasions-section.svelte';
	import FeaturedSection from '@/components/pages/(unprotected)/root/featured-section.svelte';
	import TrustSection from '@/components/pages/(unprotected)/root/trust-section.svelte';
	import { m } from '@/lib/paraglide/messages';
</script>

<SvelteHead title={m['Components.SvelteHead.home']()} />

<HeroSection />
<CategorySection />
<OccasionsSection />
<FeaturedSection />
<TrustSection />
