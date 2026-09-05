<script lang="ts">
	// UTILS
	import { formatDateTime } from '@/shared/utils/date';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	let {
		banExpires,
		banReason
	}: {
		banExpires: number | null;
		banReason: string | null;
	} = $props();
</script>

<section
	aria-labelledby="ban-heading"
	class="rounded-4xl border border-destructive/20 bg-destructive/5 p-5"
>
	<div class="flex gap-3">
		<span class="mt-0.5 shrink-0 text-destructive" aria-hidden="true">
			<span class="icon-[lucide--ban] size-5"></span>
		</span>
		<div class="flex min-w-0 flex-1 flex-col gap-3">
			<h3 id="ban-heading" class="text-sm font-semibold text-destructive">
				{m['AdminUserPage.AdminUserTabsProfileBanned.accountBanned']()}
			</h3>
			<dl class="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[6rem_minmax(0,1fr)]">
				<dt class="text-muted-foreground">
					{m['AdminUserPage.AdminUserTabsProfileBanned.expires']()}
				</dt>
				<dd class="font-medium">
					{banExpires !== null
						? formatDateTime(banExpires, getLocale())
						: m['AdminUserPage.AdminUserTabsProfileBanned.noExpirationSet']()}
				</dd>
				{#if banReason}
					<dt class="text-muted-foreground">
						{m['AdminUserPage.AdminUserTabsProfileBanned.reason']()}
					</dt>
					<dd class="font-medium wrap-break-word">{banReason}</dd>
				{/if}
			</dl>
		</div>
	</div>
</section>
