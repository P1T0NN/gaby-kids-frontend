<script lang="ts">
	// CONSTANTS
	import { COMPANY_DATA } from '@/shared/config';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';

	type FooterLink = { label: string; href?: string; external?: boolean };

	const year = new Date().getFullYear();

	const columns: { title: string; links: FooterLink[] }[] = [
		{
			title: 'Comprar',
			links: [
				{ label: 'Ropones niña', href: UNPROTECTED_PAGE_ENDPOINTS.SHOP },
				{ label: 'Batitas bautizo', href: UNPROTECTED_PAGE_ENDPOINTS.SHOP },
				{ label: 'Guayaberas gabybera', href: UNPROTECTED_PAGE_ENDPOINTS.SHOP },
				{ label: 'Primera comunión', href: UNPROTECTED_PAGE_ENDPOINTS.SHOP },
				{ label: 'Trajes de charro', href: UNPROTECTED_PAGE_ENDPOINTS.SHOP }
			]
		},
		{
			title: 'Redes',
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
				Confort y Elegancia en Ropa para Niños. Taller propio en Jalisco desde 1998.
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
						{#if link.href}
							<Link
								href={link.href}
								target={link.external ? '_blank' : undefined}
								rel={link.external ? 'noopener noreferrer' : undefined}
								class="transition-colors hover:text-background"
							>
								{link.label}
							</Link>
						{:else}
							<span>{link.label}</span>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<div
		class="flex flex-col gap-2 border-t border-background/15 pt-6 text-xs text-background/60 sm:flex-row sm:items-center sm:justify-between"
	>
		<p>© {year} Gaby Kids ® · Aviso de Privacidad · Términos</p>
		<p>Visa · Mastercard · Amex · OXXO · Mercado Pago · SPEI</p>
	</div>
</Section>
