<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import ContactSection from '@/components/pages/(unprotected)/contact/contact-section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
</script>

<SvelteHead title={m['ContactPage.pageTitle']()} description={m['ContactPage.description']()} />

<ContactSection />
