// TYPES
type ProductVariantOptions = {
	options: readonly { name: string; value: string }[];
};

export type ProductVariantOptionGroup = {
	name: string;
	values: string[];
};

/** One group per product option, with the unique values in product variant order. */
export function getProductVariantOptionGroups(
	productVariantOptionNames: readonly string[],
	productVariants: readonly ProductVariantOptions[]
): ProductVariantOptionGroup[] {
	return productVariantOptionNames.map((name, optionIndex) => {
		const values: string[] = [];

		for (const productVariant of productVariants) {
			const value = productVariant.options[optionIndex]?.value.trim();
			if (value && !values.includes(value)) values.push(value);
		}

		return { name, values };
	});
}

/** The product variant matching exactly one value per option group, if it exists. */
export function findProductVariantByOptionValues<T extends ProductVariantOptions>(
	productVariants: readonly T[],
	optionValues: readonly string[]
): T | undefined {
	return productVariants.find(
		(productVariant) =>
			productVariant.options.length === optionValues.length &&
			productVariant.options.every(
				(option, optionIndex) => option.value.trim() === optionValues[optionIndex]?.trim()
			)
	);
}
