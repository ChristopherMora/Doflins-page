/**
 * Maps a Shopify product handle and tags to an available local GLB model.
 * Returns null when no model exists for this product.
 *
 * Add new entries here as you upload .glb files to /public/models/doflins/
 */
export function resolveProductModelUrl(handle: string, tags: string[]): string | null {
  const haystack = [handle, ...tags].join(" ").toLowerCase();

  if (/michael.myers|m.myers/.test(haystack)) {
    return "/models/doflins/michael-myers-multicolor.glb";
  }

  return null;
}
