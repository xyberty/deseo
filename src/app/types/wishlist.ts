// src/types/wishlist.ts
export interface WishlistItem {
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;      // Optional currency override (ISO 4217 alpha-3 code)
    url?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Reservation {
    itemId: string;
    reserverId: string;
    reserverEmail: string | null;
    displayName?: string;
    passphrase?: string;
    reservedAt: Date;
    allowDisclosure: boolean;
  }
  
  export interface Wishlist {
    _id?: string;
    title: string;
    description?: string;
    currency?: string;      // List currency (ISO 4217 alpha-3 code), defaults to USD
    items: WishlistItem[];
    reservations?: Reservation[];
    
    // Authentication/ownership fields
    userId?: string;         // For authenticated users
    ownerToken?: string;     // For anonymous creators (temporary token)
    shareToken?: string;     // For sharing (permanent token)
    isPublic: boolean;       // Whether non-authenticated users can view
    allowEdits: boolean;     // Whether the wishlist can be edited by viewers
    isArchived?: boolean;    // Whether the wishlist is archived (soft delete)
    
    // Tracking
    createdAt: Date;
    updatedAt: Date;
  }