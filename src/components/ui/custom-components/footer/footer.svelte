<script lang="ts">
	// CONSTANTS
	import { COMPANY_DATA } from '@/shared/config';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';

	type FooterLink = { label: string; href: string; external?: boolean };

	const year = new Date().getFullYear();

	const columns: { title: string; links: FooterLink[] }[] = [
		{
			title: m['Components.Footer.shopTitle'](),
			links: [
				{ label: m['Components.Footer.girlsGowns'](), href: UNPROTECTED_PAGE_ENDPOINTS.SHOP },
				{ label: m['Components.Footer.baptismDresses'](), href: UNPROTECTED_PAGE_ENDPOINTS.SHOP },
				{ label: m['Components.Footer.guayaberas'](), href: UNPROTECTED_PAGE_ENDPOINTS.SHOP },
				{ label: m['Components.Footer.firstCommunion'](), href: UNPROTECTED_PAGE_ENDPOINTS.SHOP },
				{ label: m['Components.Footer.charroSuits'](), href: UNPROTECTED_PAGE_ENDPOINTS.SHOP }
			]
		},
		{
			title: m['Components.Footer.socialTitle'](),
			links: [
				{ label: 'Instagram', href: COMPANY_DATA.INSTAGRAM_URL, external: true },
				{ label: 'Facebook', href: COMPANY_DATA.FACEBOOK_URL, external: true },
				{ label: 'WhatsApp', href: COMPANY_DATA.WHATSAPP_CONTACT_URL, external: true }
			]
		}
	];
</script>

<Section
	as="footer"
	class="bg-foreground text-background"
	size="none"
	width="full"
	containerClass="flex max-w-7xl flex-col gap-13 px-6 pt-18 pb-8 sm:px-12"
>
	<div class="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
		<div class="flex flex-col gap-3.5 sm:col-span-2 lg:col-span-1">
			<p class="font-serif text-3xl">Gaby Kids ®</p>
			<p class="max-w-xs text-sm leading-relaxed text-background/75">
				{m['Components.Footer.tagline']()}
			</p>
			<p class="text-xs font-medium tracking-widest text-accent uppercase">@gabykids_mex</p>
		</div>
		{#each columns as column (column.title)}
			<div class="flex flex-col gap-3">
				<p class="text-xs font-medium tracking-widest text-background/50 uppercase">
					{column.title}
				</p>
				<div class="flex flex-col text-sm leading-loose text-background/90">
					{#each column.links as link (link.label)}
						{#if link.external}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								class="transition-colors hover:text-background"
							>
								{link.label}
							</a>
						{:else}
							<Link href={link.href} class="transition-colors hover:text-background">
								{link.label}
							</Link>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<div
		class="flex flex-col gap-2 border-t border-background/15 pt-6 text-xs text-background/60 sm:flex-row sm:items-center sm:justify-between"
	>
		<p>
			© {year} Gaby Kids ® · {m['Components.Footer.privacy']()} · {m['Components.Footer.terms']()}
		</p>
		<p>Visa · Mastercard · Amex · OXXO · Mercado Pago · SPEI</p>
	</div>
</Section>
