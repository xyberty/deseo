"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';
import type { Wishlist, WishlistItem } from '@/app/types/wishlist';
import { MagicLinkForm } from '@/app/components/MagicLinkForm';
import { use } from 'react';

export default function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<WishlistItem>>({
    name: '',
    description: '',
    price: undefined,
    url: '',
    imageUrl: '',
  });

  useEffect(() => {
    fetchWishlist();
  }, [resolvedParams.id]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}`);
      if (!response.ok) throw new Error('Failed to fetch wishlist');
      const data = await response.json();
      setWishlist(data);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to load wishlist',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlist) return;

    const newItemWithId: WishlistItem = {
      ...newItem,
      id: crypto.randomUUID(),
    } as WishlistItem;

    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItemWithId),
      });

      if (!response.ok) throw new Error('Failed to add item');

      setWishlist({
        ...wishlist,
        items: [...wishlist.items, newItemWithId],
      });

      setNewItem({
        name: '',
        description: '',
        price: undefined,
        url: '',
        imageUrl: '',
      });

      toast.success('Item added successfully');
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to add item',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-gray-900">Wishlist not found</h1>
          <p className="mt-2 text-gray-600">The wishlist you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 max-w-4xl min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">{wishlist.title}</h1>
          {wishlist.description && (
            <p className="text-gray-600 mt-1">{wishlist.description}</p>
          )}
        </div>
        <Button onClick={() => setShowSaveForm(true)}>
          Save & Share
        </Button>
      </div>

      {showSaveForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-heading font-bold mb-4">Save Your Wishlist</h2>
            <p className="text-gray-600 mb-4">
              Enter your email to save your wishlist and get a magic link to share it.
            </p>
            <MagicLinkForm onSuccess={() => {
              setShowSaveForm(false);
              fetchWishlist(); // Refresh to get updated wishlist with user ID
            }} />
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <form onSubmit={handleAddItem} className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-heading font-semibold mb-4">Add New Item</h2>
          <div className="grid gap-4">
            <Input
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              required
            />
            <Input
              placeholder="Description (optional)"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Price (optional)"
              value={newItem.price || ''}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              placeholder="URL (optional)"
              value={newItem.url}
              onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
            />
            <Input
              placeholder="Image URL (optional)"
              value={newItem.imageUrl}
              onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
            />
            <Button type="submit">Add Item</Button>
          </div>
        </form>

        <div className="grid gap-4">
          {wishlist.items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-heading font-semibold text-gray-900">{item.name}</h3>
              {item.description && (
                <p className="text-gray-600 mt-1">{item.description}</p>
              )}
              {item.price && (
                <p className="text-green-600 mt-1">${item.price}</p>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mt-2 block"
                >
                  View Item
                </a>
              )}
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="mt-2 max-w-xs rounded"
                />
              )}
              {item.reservedBy && (
                <p className="text-orange-600 mt-2">
                  Reserved by: {item.reservedBy}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 