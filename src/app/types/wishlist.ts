// src/types/wishlist.ts
export interface WishlistItem {
    id: string;
    name: string;
    description?: string;
    price?: number;
    url?: string;
    imageUrl?: string;
    reservedBy?: string;
    reservedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Wishlist {
    _id: string;
    userId: string;
    title: string;
    description?: string;
    items: WishlistItem[];
    createdAt: Date;
    updatedAt: Date;
  }