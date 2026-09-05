<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { TableCell } from '@/components/ui/table/index.js';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type Category = Doc<'categories'>;

	let { category }: { category: Category } = $props();
	let pendingAction = $state<'delete' | null>(null);
	const deleteCategory = useMutation(api.tables.categories.mutations.deleteCategory.deleteCategory);

	async function handleDelete(close: () => void): Promise<void> {
		if (pendingAction !== null) return;

		pendingAction = 'delete';
		try {
			await deleteCategory({ id: category._id });
			toastMessage({
				type: 'success',
				message: m['AdminCategoriesPage.AdminCategoriesTableItem.categoryDeleted']()
			});
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['AdminCategoriesPage.AdminCategoriesTableItem.deleteError']()
			});
		} finally {
			pendingAction = null;
			close();
		}
	}
</script>

{#snippet actionsTrigger()}
	<span class="icon-[lucide--ellipsis] size-4" aria-hidden="true"></span>
{/snippet}

<TableCell>
	<a
		href={ADMIN_PAGE_ENDPOINTS.EDIT_CATEGORY(category._id)}
		class="group inline-flex min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
	>
		<span class="icon-[lucide--folder] size-5 shrink-0 text-muted-foreground" aria-hidden="true"
		></span>
		<div class="min-w-0">
			<p class="truncate font-medium group-hover:underline">{category.name}</p>
		</div>
	</a>
</TableCell>
<TableCell class="font-mono text-xs whitespace-nowrap">{category.slug}</TableCell>
<TableCell>
	<Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
		{category.status === 'active'
			? m['AdminCategoriesPage.AdminCategoriesTableItem.active']()
			: m['AdminCategoriesPage.AdminCategoriesTableItem.archived']()}
	</Badge>
</TableCell>
<TableCell class="text-right">
	<NativePopover
		id={`category-actions-${category._id}`}
		trigger={actionsTrigger}
		triggerLabel={m['AdminCategoriesPage.AdminCategoriesTableItem.openCategoryActions']({
			name: category.name
		})}
		triggerClass="size-8 justify-center hover:bg-muted [&_svg]:size-4"
		class="min-w-44"
	>
		<a
			href={ADMIN_PAGE_ENDPOINTS.EDIT_CATEGORY(category._id)}
			class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
		>
			<span class="icon-[lucide--pencil] size-4" aria-hidden="true"></span>
			{m['AdminCategoriesPage.AdminCategoriesTableItem.editCategory']()}
		</a>
		<NativeDialog>
			{#snippet trigger({ open })}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					class="w-full justify-start rounded-xl px-3 py-2 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
					onclick={open}
					disabled={pendingAction !== null}
				>
					<span class="icon-[lucide--trash-2] size-4" aria-hidden="true"></span>
					{m['AdminCategoriesPage.AdminCategoriesTableItem.deleteCategory']()}
				</Button>
			{/snippet}

			{#snippet children({ close })}
				<div class="flex flex-col gap-5 p-6">
					<div class="flex flex-col gap-1.5">
						<h2 class="text-lg font-semibold">
							{m['AdminCategoriesPage.AdminCategoriesTableItem.deleteConfirmationTitle']()}
						</h2>
						<p class="text-sm text-muted-foreground">
							{m['AdminCategoriesPage.AdminCategoriesTableItem.deleteConfirmationDescription']({
								name: category.name
							})}
						</p>
					</div>

					<div class="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={close}
							disabled={pendingAction !== null}
						>
							{m['AdminCategoriesPage.AdminCategoriesTableItem.cancel']()}
						</Button>
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onclick={() => void handleDelete(close)}
							disabled={pendingAction !== null}
						>
							{#if pendingAction === 'delete'}<Spinner data-icon="inline-start" />{/if}
							{m['AdminCategoriesPage.AdminCategoriesTableItem.deleteCategory']()}
						</Button>
					</div>
				</div>
			{/snippet}
		</NativeDialog>
	</NativePopover>
</TableCell>
