<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { z } from 'zod';
	import { m } from '@/lib/paraglide/messages';

	// CONSTANTS
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// UTILS
	import { formatDateTime, formatRelativeTime } from '@/shared/utils/date';
	import { getLocale } from '@/lib/paraglide/runtime';

	const banDetailsSchema = z.object({ banExpires: z.number().nullable() });
	type BanDetails = z.infer<typeof banDetailsSchema>;

	function parseBanDetails(description: string | null): BanDetails | null {
		if (!description) return null;

		try {
			const result = banDetailsSchema.safeParse(JSON.parse(description));
			return result.success ? result.data : null;
		} catch {
			return null;
		}
	}

	const errorCode = $derived(page.url.searchParams.get('error'));
	const errorDescription = $derived(page.url.searchParams.get('error_description'));
	const isBanned = $derived(errorCode === 'BANNED_USER');
	const banDetails = $derived(isBanned ? parseBanDetails(errorDescription) : null);
</script>

<SvelteHead
	title={isBanned
		? m['AuthErrorPage.accountBannedTitle']()
		: m['AuthErrorPage.authenticationErrorTitle']()}
	noindex
/>

<main class="flex min-h-screen w-full items-center justify-center px-4">
	<section
		class="flex w-full max-w-lg flex-col items-center gap-5 text-center"
		aria-labelledby="error-heading"
	>
		<span aria-hidden="true" class="icon-[lucide--ban] size-12 text-destructive"></span>

		<div class="flex flex-col gap-2">
			<p class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
				{isBanned
					? m['AuthErrorPage.accessBlocked']()
					: m['AuthErrorPage.authenticationErrorTitle']()}
			</p>
			<h1 id="error-heading" class="text-2xl font-semibold tracking-tight">
				{isBanned
					? m['AuthErrorPage.yourAccountIsBanned']()
					: m['AuthErrorPage.authenticationErrorTitle']()}
			</h1>
		</div>

		<p class="max-w-md text-sm text-muted-foreground">
			{isBanned ? m['AuthErrorPage.bannedDescription']() : m['AuthErrorPage.genericDescription']()}
		</p>

		{#if banDetails && banDetails.banExpires !== null}
			<div class="flex flex-col gap-1 text-sm text-muted-foreground" aria-live="polite">
				<p>
					{m['AuthErrorPage.remaining']({
						time: formatRelativeTime(banDetails.banExpires, getLocale())
					})}
				</p>
				<p>
					{m['AuthErrorPage.banEnds']({
						date: formatDateTime(banDetails.banExpires, getLocale())
					})}
				</p>
			</div>
		{:else if banDetails}
			<p class="text-sm text-muted-foreground">{m['AuthErrorPage.banDoesNotExpire']()}</p>
		{/if}

		<div class="flex flex-wrap justify-center gap-3">
			<Button href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN} variant="outline">
				{m['AuthErrorPage.tryAgain']()}
			</Button>
			<Button href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}>{m['AuthErrorPage.goHome']()}</Button>
		</div>
	</section>
</main>
