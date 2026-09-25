import { expect, test } from 'vitest';
import { getGeneratedProductVariantSku } from '../src/shared/features/productVariants/utils/getGeneratedProductVariantSku.js';
import { PRODUCT_VARIANTS_CONFIG } from '../src/shared/features/productVariants/config.js';

test('builds a compact SKU from the product slug and option values', () => {
	expect(
		getGeneratedProductVariantSku({
			slug: 'bata-de-organza-con-tul-bordado-con-gorro-blanca',
			optionValues: ['Blanca', '3-6 meses'],
			position: 0
		})
	).toBe('BAT-ORG-TUL-BOR-BLA-3-6');
});

test('keeps similar products apart', () => {
	const skus = [
		'bata-de-organza-con-tul-bordado-con-gorro',
		'bata-de-organza-con-pasamaneria-con-gorro',
		'batita-de-tul-bordado-con-mono'
	].map((slug) =>
		getGeneratedProductVariantSku({
			slug,
			optionValues: ['Blanca'],
			position: 0
		})
	);

	expect(skus).toEqual(['BAT-ORG-TUL-BOR-BLA', 'BAT-ORG-PAS-GOR-BLA', 'BAT-TUL-BOR-MON-BLA']);
	expect(new Set(skus).size).toBe(skus.length);
});

test('strips accents and skips generic words', () => {
	expect(
		getGeneratedProductVariantSku({
			slug: 'vestido-de-nina-con-bordado',
			optionValues: ['Rosé'],
			position: 0
		})
	).toBe('VES-NIN-BOR-ROS');
});

test('falls back to a positional SKU when nothing usable remains', () => {
	expect(
		getGeneratedProductVariantSku({
			slug: 'de-la-con',
			optionValues: [],
			position: 2
		})
	).toBe('product-3');
});

test('stays within the configured SKU length', () => {
	const sku = getGeneratedProductVariantSku({
		slug: 'extraordinariamente-hermosa-batita-de-organza-con-tul-bordado-con-gorro',
		optionValues: [
			'Blanco perla con encaje',
			'3-6 meses talla recien nacido',
			'edicion limitada especial'
		],
		position: 0
	});

	expect(sku.length).toBeLessThanOrEqual(PRODUCT_VARIANTS_CONFIG.MAX_SKU_LENGTH);
});
