// Re-export cn from the shared utils to avoid duplication
export { cn } from "@/lib/utils";

import type { WishlistItem } from "@/app/types/wishlist";

/**
 * Get the first item image URL from a wishlist, same approach as in generateMetadata.
 * Used for displaying wishlist preview images and social sharing.
 */
export function getFirstItemImage(wishlist: { items?: WishlistItem[] }): string | undefined {
  return wishlist.items?.find((item: WishlistItem) => item.imageUrl)?.imageUrl;
}