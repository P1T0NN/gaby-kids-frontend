<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/config';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import { m } from '@/lib/paraglide/messages';

	const phoneHref = `tel:${COMPANY_DATA.PHONE.replace(/\s/g, '')}`;
</script>

<Section class="py-24 lg:py-32" size="none" width="full" containerClass="max-w-2xl px-6 sm:px-12">
	<div class="flex flex-col">
		<span class="font-sans text-xl font-medium tracking-widest text-muted-foreground uppercase">
			{m['ContactPage.ContactSection.eyebrow']()}
		</span>
		<h1 class="mt-4 font-serif text-4xl leading-tight font-light text-foreground lg:text-5xl">
			{m['ContactPage.ContactSection.heading']()}
		</h1>

		<dl class="mt-10 flex flex-col gap-7">
			<div class="flex gap-4">
				<span class="mt-1 icon-[lucide--mail] size-5 text-accent" aria-hidden="true"></span>
				<div>
					<dt class="font-sans text-xl font-medium tracking-widest text-muted-foreground uppercase">
						{m['ContactPage.ContactSection.emailLabel']()}
					</dt>
					<dd class="mt-1 text-foreground">
						<a href="mailto:{COMPANY_DATA.EMAIL}" class="hover:text-accent">{COMPANY_DATA.EMAIL}</a>
					</dd>
				</div>
			</div>

			<div class="flex gap-4">
				<span class="mt-1 icon-[lucide--phone] size-5 text-accent" aria-hidden="true"></span>
				<div>
					<dt class="font-sans text-xl font-medium tracking-widest text-muted-foreground uppercase">
						{m['ContactPage.ContactSection.phoneLabel']()}
					</dt>
					<dd class="mt-1 text-foreground">
						<a href={phoneHref} class="hover:text-accent">{COMPANY_DATA.PHONE}</a>
					</dd>
				</div>
			</div>

			<div class="flex gap-4">
				<span class="mt-1 icon-[lucide--message-circle] size-5 text-accent" aria-hidden="true"
				></span>
				<div>
					<dt class="font-sans text-xl font-medium tracking-widest text-muted-foreground uppercase">
						{m['ContactPage.ContactSection.whatsappLabel']()}
					</dt>
					<dd class="mt-1 text-foreground">
						<a
							href={COMPANY_DATA.WHATSAPP_CONTACT_URL}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-accent"
						>
							{m['ContactPage.ContactSection.whatsappLink']()}
						</a>
					</dd>
				</div>
			</div>

			<div class="flex gap-4">
				<span class="mt-1 icon-[lucide--instagram] size-5 text-accent" aria-hidden="true"></span>
				<div>
					<dt class="font-sans text-xl font-medium tracking-widest text-muted-foreground uppercase">
						{m['ContactPage.ContactSection.socialLabel']()}
					</dt>
					<dd class="mt-1 flex flex-wrap gap-x-4 text-foreground">
						<a
							href={COMPANY_DATA.INSTAGRAM_URL}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-accent"
						>
							Instagram
						</a>
						<a
							href={COMPANY_DATA.FACEBOOK_URL}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-accent"
						>
							Facebook
						</a>
					</dd>
				</div>
			</div>
		</dl>

		<Button
			href={COMPANY_DATA.WHATSAPP_CONTACT_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="mt-10 h-auto gap-2 self-start rounded-sm px-8 py-4 text-xs tracking-widest uppercase"
		>
			{m['ContactPage.ContactSection.cta']()}
			<span class="icon-[lucide--arrow-right] size-4" aria-hidden="true"></span>
		</Button>
	</div>
</Section>
