<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import HeroSection from '@/components/pages/(unprotected)/root/hero-section.svelte';
	import CategorySection from '@/components/pages/(unprotected)/root/category-section/category-section.svelte';
	import OccasionsSection from '@/components/pages/(unprotected)/root/occasions-section.svelte';
	import PopularSection from '@/components/pages/(unprotected)/root/popular-section.svelte';
	import FeaturedSection from '@/components/pages/(unprotected)/root/featured-section.svelte';
	import TrustSection from '@/components/pages/(unprotected)/root/trust-section.svelte';
	import NewsletterSection from '@/components/pages/(unprotected)/root/newsletter-section.svelte';
</script>

<SvelteHead title="Home" />

<HeroSection />
<CategorySection />
<OccasionsSection />
<PopularSection />
<FeaturedSection />
<TrustSection />
<NewsletterSection />