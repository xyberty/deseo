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
  
  export interface Reservation {
    itemId: string;
    reserverId: string;
    reserverEmail: string | null;
    passphrase?: string;
    reservedAt: Date;
  }
  
  export interface Wishlist {
    _id?: string;
    title: string;
    description?: string;
    items: WishlistItem[];
    reservations?: Reservation[];
    userId?: string;
    createdAt: Date;
    updatedAt: Date;
  }