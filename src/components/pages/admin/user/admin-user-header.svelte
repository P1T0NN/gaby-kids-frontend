<script lang="ts">
	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import { m } from '@/lib/paraglide/messages';
</script>

<div class="flex items-center">
	<ButtonLink href="/admin/users" variant="ghost" size="sm">
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
		{m['AdminUserPage.AdminUserHeader.backToUsers']()}
	</ButtonLink>
</div>
