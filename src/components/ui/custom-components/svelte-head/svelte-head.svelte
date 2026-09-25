<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';
	import { PUBLIC_ORIGIN } from '$env/static/public';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config';
	import { m } from '@/lib/paraglide/messages';

	type JsonLdValue =
		string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue };
	type JsonLdObject = { [key: string]: JsonLdValue };

	let {
		title,
		description,
		image,
		ogType = 'website',
		noindex = false,
		suffixSiteName = true,
		jsonLd
	}: {
		title?: string;
		description?: string;
		/** Site-relative or absolute social-share image. Defaults to {@link COMPANY_DATA.OG_IMAGE}. */
		image?: string;
		ogType?: 'website' | 'article';
		/** When true, private/account/checkout routes should not be indexed. */
		noindex?: boolean;
		/** Append ` | {site name}` to the document title. Disable for the home page. */
		suffixSiteName?: boolean;
		/**
		 * This page's structured data, as a plain object — serialized and escaped here, so the
		 * one rule that keeps catalog text from breaking out of a script block lives in one file.
		 * A page cannot emit it itself: `<svelte:head>` is illegal inside a block, and page data
		 * that arrives as a streamed promise is only readable inside one.
		 */
		jsonLd?: JsonLdObject;
	} = $props();

	// Stable configured origin for canonical/OG URLs; falls back to the request origin
	// when `PUBLIC_SITE_URL` is unset (e.g. preview deploys without env configured).
	const origin = $derived((PUBLIC_ORIGIN || page.url.origin).replace(/\/+$/, ''));

	const pathname = $derived(page.url.pathname);
	const canonical = $derived(`${origin}${pathname}`);

	const titleFromPath = $derived.by(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return m['Components.SvelteHead.home']();
		return segments[segments.length - 1]
			.replace(/[-_]+/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase());
	});

	const resolvedTitle = $derived(title ?? titleFromPath);
	const fullTitle = $derived(
		suffixSiteName ? `${resolvedTitle} | ${COMPANY_DATA.NAME}` : resolvedTitle
	);
	const resolvedDescription = $derived(
		description ??
			(resolvedTitle === m['Components.SvelteHead.home']()
				? COMPANY_DATA.DESCRIPTION
				: `${resolvedTitle} — ${COMPANY_DATA.DESCRIPTION}`)
	);

	const isCustomImage = $derived(image !== undefined && image !== COMPANY_DATA.OG_IMAGE);
	const imagePath = $derived(image ?? COMPANY_DATA.OG_IMAGE);
	const imageUrl = $derived(/^https?:\/\//.test(imagePath) ? imagePath : `${origin}${imagePath}`);

	/**
	 * `Store` structured data. The business itself is not a per-page entity, so exactly one page
	 * may declare it — the home page, matched by route id rather than by pathname so locale
	 * prefixes or a moved root never silently drop it. Every value comes from `COMPANY_DATA`.
	 *
	 * `Store` is the neutral LocalBusiness subtype for a universal template. A fork selling one
	 * category can narrow it (`Winery`, `Bakery`, `ClothingStore`, …) — that is the only line
	 * to change.
	 */
	const isHome = $derived(page.route.id === '/');

	const localBusinessLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Store',
		name: COMPANY_DATA.NAME,
		description: COMPANY_DATA.DESCRIPTION,
		url: origin,
		image: `${origin}${COMPANY_DATA.OG_IMAGE}`,
		logo: `${origin}${COMPANY_DATA.LOGO}`,
		email: COMPANY_DATA.EMAIL,
		// `PHONE` carries its own country code (config), so no dial prefix is hardcoded here —
		// a template that assumed one country would emit wrong structured data in every other.
		telephone: COMPANY_DATA.PHONE.replace(/\s/g, ''),
		/*address: {
			'@type': 'PostalAddress',
			streetAddress: `${COMPANY_DATA.ADDRESS.STREET}, ${COMPANY_DATA.ADDRESS.NEIGHBORHOOD}`,
			postalCode: COMPANY_DATA.ADDRESS.POSTAL_CODE,
			addressLocality: COMPANY_DATA.ADDRESS.CITY,
			addressRegion: COMPANY_DATA.ADDRESS.REGION,
			addressCountry: COMPANY_DATA.ADDRESS.COUNTRY_CODE
		},
		openingHoursSpecification: COMPANY_DATA.HOURS.map((h) => ({
			'@type': 'OpeningHoursSpecification',
			dayOfWeek: h.SCHEMA_DAYS,
			opens: h.OPENS,
			closes: h.CLOSES
		})),*/
		sameAs: [COMPANY_DATA.INSTAGRAM_URL, COMPANY_DATA.FACEBOOK_URL]
	});

	// `<` is escaped so a string containing a closing script tag can't break out of it. `TAG` is
	// interpolated rather than written literally for the same reason: a spelled-out closing script
	// tag anywhere in this block would end the block.
	const TAG = 'script';
	const ldTag = (data: JsonLdValue) =>
		`<${TAG} type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</${TAG}>`;

	const localBusinessTag = $derived(ldTag(localBusinessLd));
	const pageLdTag = $derived(jsonLd ? ldTag(jsonLd) : null);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={resolvedDescription} />
	<link rel="canonical" href={canonical} />

	<!-- Open Graph -->
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={COMPANY_DATA.NAME} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={resolvedDescription} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:alt" content="{resolvedTitle} — {COMPANY_DATA.NAME}" />
	{#if !isCustomImage}
		<meta property="og:image:width" content={String(COMPANY_DATA.OG_IMAGE_WIDTH)} />
		<meta property="og:image:height" content={String(COMPANY_DATA.OG_IMAGE_HEIGHT)} />
	{/if}
	<meta property="og:locale" content="es_MX" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={resolvedDescription} />
	<meta name="twitter:image" content={imageUrl} />

	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	{#if isHome}
		<!-- Serialized static config with `<` escaped, no user input: the one safe use of @html. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html localBusinessTag}
	{/if}

	{#if pageLdTag}
		<!-- Serialized page data with `<` escaped: same rule, same one safe use of @html. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html pageLdTag}
	{/if}
</svelte:head>
