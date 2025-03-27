"use client";

import { useEffect, useState } from 'react';
import type { Wishlist } from '@/app/types/wishlist';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

export default function DashboardPage() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlists = async () => {
      try {
        const response = await fetch('/api/wishlists');
        if (!response.ok) throw new Error('Failed to fetch wishlists');
        const data = await response.json();
        setWishlists(data);
      } catch (error) {
        console.error('Error fetching wishlists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlists();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-montserrat font-bold text-primary">My Wishlists</h1>
        <Link href="/create">
          <Button>Create New Wishlist</Button>
        </Link>
      </div>

      {wishlists.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <h2 className="text-2xl font-montserrat font-semibold text-primary mb-4">No wishlists yet</h2>
          <p className="text-muted-foreground mb-6">Create your first wishlist to get started!</p>
          <Link href="/create">
            <Button>Create Wishlist</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlists.map((wishlist) => (
            <Link
              key={wishlist._id}
              href={`/wishlist/${wishlist._id}`}
              className="block p-6 bg-card rounded-lg border shadow-xs hover:shadow-md transition-all duration-200"
              data-slot="wishlist-card"
            >
              <h2 className="text-xl font-montserrat font-semibold text-card-foreground mb-2">
                {wishlist.title}
              </h2>
              <p className="text-muted-foreground mb-4">{wishlist.description}</p>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{wishlist.items.length} items</span>
                <span>
                  {new Date(wishlist.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 