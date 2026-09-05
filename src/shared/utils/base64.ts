// Universal base64 helpers that survive non-ASCII (UTF-8) values. `btoa`/`atob`
// alone choke on anything outside Latin-1, so encode via TextEncoder/Decoder.

/** `btoa` for arbitrary UTF-8 strings. */
export const encodeBase64 = (s: string) =>
	btoa(String.fromCharCode(...new TextEncoder().encode(s)));

/** `atob` for arbitrary UTF-8 strings. */
export const decodeBase64 = (s: string) =>
	new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
