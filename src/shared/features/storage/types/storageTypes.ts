// All storage types live here — consumers import from this file only.

/** Client-side image optimization (browser-image-compression → WebP). */
export type ClientOptimizeOptions = {
	/** Longest side in px after resize. */
	maxWidthOrHeight?: number;
	/** Target max output size in MB. */
	maxSizeMB?: number;
	/** Output quality 0–1. */
	quality?: number;
	/** Target width/height ratio of the output; the image is padded, never cropped. */
	aspectRatio?: number;
	/** Padding color used when the source ratio differs from the target ratio. */
	background?: string;
};
