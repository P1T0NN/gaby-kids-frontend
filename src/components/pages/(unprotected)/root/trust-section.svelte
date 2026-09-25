<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/config';

	// COMPONENTS
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import { m } from '@/lib/paraglide/messages';

	type TrustItem = {
		icon: string;
		title: () => string;
		description: () => string;
		cta?: () => string;
		href?: string;
	};

	const confianza: TrustItem[] = [
		{
			icon: 'icon-[lucide--truck]',
			title: () => m['HomePage.TrustSection.shipping'](),
			description: () => m['HomePage.TrustSection.shippingDescription']()
		},
		{
			icon: 'icon-[lucide--scissors]',
			title: () => m['HomePage.TrustSection.handmade'](),
			description: () => m['HomePage.TrustSection.handmadeDescription']()
		},
		{
			icon: 'icon-[lucide--briefcase]',
			title: () => m['HomePage.TrustSection.wholesale'](),
			description: () => m['HomePage.TrustSection.wholesaleDescription'](),
			cta: () => m['HomePage.TrustSection.wholesaleCta'](),
			href: COMPANY_DATA.WHATSAPP_CONTACT_URL
		}
	];
</script>

<Section
	class="border-b border-border py-14"
	size="none"
	width="full"
	containerClass="grid max-w-7xl grid-cols-1 gap-10 px-6 sm:grid-cols-3 sm:px-12"
>
	{#each confianza as item (item.icon)}
		<div class="flex items-start gap-4">
			<div
				class="grid size-14 flex-none place-content-center rounded-full bg-secondary text-muted-foreground"
			>
				<span class="{item.icon} size-6" aria-hidden="true"></span>
			</div>
			<div class="flex flex-col gap-1">
				<p class="font-medium text-foreground">{item.title()}</p>
				<p class="text-sm leading-relaxed text-muted-foreground">{item.description()}</p>
				{#if item.cta && item.href}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a
						href={item.href}
						target="_blank"
						rel="noopener noreferrer"
						class="mt-1.5 inline-flex items-center gap-1 self-start text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-accent"
					>
						{item.cta()}
						<span class="icon-[lucide--arrow-right] size-4" aria-hidden="true"></span>
					</a>
				{/if}
			</div>
		</div>
	{/each}
</Section>
