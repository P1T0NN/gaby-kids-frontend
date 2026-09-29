// UTILS
import { normalizeProductOptionText } from '@/shared/features/productVariants/utils/normalizeProductOptionText.js';

const SHOP_COLOR_SWATCH_CLASSES = new Map<string, string>([
	['blanco', 'bg-swatch-blanco'],
	['beige', 'bg-swatch-beige'],
	['negro', 'bg-swatch-negro'],
	['azul marino', 'bg-swatch-azul-marino'],
	['arena', 'bg-swatch-arena'],
	['caqui', 'bg-swatch-caqui']
]);

export function getShopColorSwatchClass(value: string): string {
	return SHOP_COLOR_SWATCH_CLASSES.get(normalizeProductOptionText(value)) ?? 'bg-muted';
}
