<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// COMPONENTS
	import * as Breadcrumb from '@/components/ui/breadcrumb/index.js';
	import { m } from '@/lib/paraglide/messages';

	type BreadcrumbItem = {
		label: string;
		href?: string;
	};

	type Props = {
		title?: string;
		pageName?: string;
		rootHref?: string;
	};

	let {
		title = m['Components.NativeSidebarPageHeader.title'](),
		pageName,
		rootHref
	}: Props = $props();

	const actionSegments = new Set(['add', 'create', 'delete', 'edit', 'new', 'update', 'view']);

	const isDynamicSegment = (segment: string) => segment.startsWith('[');

	const getRouteSegments = (routeId: string | null) =>
		(routeId ?? '').split('/').filter((segment) => segment && !segment.startsWith('('));

	const toPageName = (segment: string) =>
		segment
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/[-_]+/g, ' ')
			.replace(/\b\w/g, (character) => character.toUpperCase());

	const getRouteParameterName = (segment: string) =>
		segment
			.replace(/^\[\[?/, '')
			.replace(/\]\]?$/, '')
			.replace(/^\.\.\./, '')
			.split('=')[0];

	const getPathSegment = (segment: string) => {
		if (!isDynamicSegment(segment)) return segment;

		const value = Object.entries(page.params).find(
			([name]) => name === getRouteParameterName(segment)
		)?.[1];
		return segment.includes('...') ? (value ?? '') : value ? encodeURIComponent(value) : '';
	};

	const breadcrumbs = $derived.by(() => {
		const segments = getRouteSegments(page.route.id);
		const pageNames = segments.filter((segment) => !isDynamicSegment(segment)).map(toPageName);
		const items: BreadcrumbItem[] = [];
		const pathSegments: string[] = [];
		let pageNameIndex = 0;

		for (const segment of segments) {
			const pathSegment = getPathSegment(segment);
			if (pathSegment) pathSegments.push(pathSegment);

			if (isDynamicSegment(segment)) continue;

			const label = pageNames[pageNameIndex] ?? title;
			const resourceName = pageNames[pageNameIndex - 1];
			items.push({
				label:
					pageNameIndex === 0
						? title
						: actionSegments.has(segment) && resourceName
							? `${label} ${resourceName}`
							: label,
				href: `/${pathSegments.join('/')}`
			});
			pageNameIndex += 1;
		}

		const hasDynamicSegment = segments.some(isDynamicSegment);
		if (pageName) {
			const shouldAppendPageName = hasDynamicSegment || items.length === 1;
			if (shouldAppendPageName) {
				items.push({ label: pageName });
			} else if (items.length > 1) {
				items[items.length - 1].label = pageName;
			}
		}

		if (items.length === 0) items.push({ label: title });
		else items[items.length - 1].href = undefined;
		if (rootHref && items[0]) items[0].href = rootHref;

		return items;
	});
</script>

<Breadcrumb.Breadcrumb>
	<Breadcrumb.BreadcrumbList class="flex-nowrap gap-1 overflow-hidden text-sm">
		{#each breadcrumbs as breadcrumb, index (index)}
			{#if index > 0}
				<Breadcrumb.BreadcrumbSeparator />
			{/if}

			<Breadcrumb.BreadcrumbItem>
				{#if breadcrumb.href}
					<Breadcrumb.BreadcrumbLink href={breadcrumb.href}
						>{breadcrumb.label}</Breadcrumb.BreadcrumbLink
					>
				{:else}
					<Breadcrumb.BreadcrumbPage>{breadcrumb.label}</Breadcrumb.BreadcrumbPage>
				{/if}
			</Breadcrumb.BreadcrumbItem>
		{/each}
	</Breadcrumb.BreadcrumbList>
</Breadcrumb.Breadcrumb>
