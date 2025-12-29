import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { WishlistItem } from "@/app/types/wishlist";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the first item image URL from a wishlist, same approach as in generateMetadata.
 * Used for displaying wishlist preview images and social sharing.
 */
export function getFirstItemImage(wishlist: { items?: WishlistItem[] }): string | undefined {
  return wishlist.items?.find((item: WishlistItem) => item.imageUrl)?.imageUrl;
}