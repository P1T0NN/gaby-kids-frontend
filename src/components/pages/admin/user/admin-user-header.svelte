<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import { m } from '@/lib/paraglide/messages';
</script>

<div class="flex items-center">
	<Button href="/admin/users" variant="ghost" size="sm">
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
		{m['AdminUserPage.AdminUserHeader.backToUsers']()}
	</Button>
</div>
