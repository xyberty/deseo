// src/app/types/shortlink.ts
export interface ShortLink {
  _id?: string;
  shortCode: string;        // e.g., "a3k9m2" (6-8 chars)
  wishlistId: string;       // MongoDB ObjectId as string
  shareToken: string;       // The share token for the wishlist
  customCode?: boolean;     // Whether this is a custom code set by user
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;         // Optional expiration
}

export interface ShortLinkClick {
  _id?: string;
  shortCode: string;
  wishlistId: string;
  clickedAt: Date;
  referer?: string;         // HTTP referer header
  userAgent?: string;       // User agent string
  ipAddress?: string;       // IP address (for analytics, consider privacy)
}

export interface ShortLinkAnalytics {
  shortCode: string;
  totalClicks: number;
  clicksByDate: Array<{
    date: string;           // ISO date string
    count: number;
  }>;
  recentClicks: Array<{
    clickedAt: Date;
    referer?: string;
    userAgent?: string;
  }>;
}

