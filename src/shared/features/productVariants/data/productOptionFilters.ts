/**
 * Statically declared storefront option filters. `key` is the URL/client/server
 * filter key, `optionName` is the option name admins type on product variants
 * (matched after normalization), `label` is the name shown in the shop, and
 * `values` are the option values the filter offers (normalized into URL
 * values). Add an entry to expose another filter; an empty list disables option
 * filters for the project.
 */
export const PRODUCT_OPTION_FILTERS = [
	{
		key: 'color',
		optionName: 'Color',
		label: 'Color',
		values: ['Blanco', 'Beige', 'Negro', 'Azul marino', 'Arena', 'Caqui']
	},
	{
		key: 'age',
		optionName: 'Size',
		label: 'Age',
		values: ['3M', '0', '1', '2', '3', '4', '5', '6', '8', '10']
	}
] as const;
