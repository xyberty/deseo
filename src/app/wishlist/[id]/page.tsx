"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import type { Wishlist, WishlistItem } from '@/app/types/wishlist';
import { MagicLinkForm } from '@/app/components/MagicLinkForm';
import { use } from 'react';
import { Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import Link from 'next/link';

export default function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, [resolvedParams.id]);

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSaveForm) {
        setShowSaveForm(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showSaveForm]);

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

    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          description: newItemDescription,
          price: newItemPrice ? parseFloat(newItemPrice) : undefined,
          url: newItemUrl,
          imageUrl: newItemImageUrl
        }),
      });

      if (!response.ok) throw new Error('Failed to add item');

      // Reset form
      setNewItemName('');
      setNewItemDescription('');
      setNewItemPrice('');
      setNewItemUrl('');
      setNewItemImageUrl('');

      // Refresh wishlist
      fetchWishlist();
      toast.success('Item added successfully');
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to add item',
      });
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlist || !editingItem) return;

    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.name,
          description: editingItem.description,
          price: editingItem.price,
          url: editingItem.url,
          imageUrl: editingItem.imageUrl
        }),
      });

      if (!response.ok) throw new Error('Failed to update item');

      setEditDialogOpen(false);
      setEditingItem(null);
      fetchWishlist();
      toast.success('Item updated successfully');
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update item',
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!wishlist || !itemToDelete) return;

    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}/items/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete item');

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchWishlist();
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to delete item',
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
          <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
            <button
              onClick={() => setShowSaveForm(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
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
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={newItemImageUrl}
                onChange={(e) => setNewItemImageUrl(e.target.value)}
              />
            </div>
            <Button type="submit">Add Item</Button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.items.map((item) => (
            <Card key={item.id} className="flex flex-col">
              {item.imageUrl && (
                <div className="aspect-square rounded-t-lg overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="flex-none">
                <CardTitle>{item.name}</CardTitle>
                {item.description && (
                  <CardDescription>{item.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {item.price && (
                  <p className="text-green-600 font-medium mt-1">${item.price.toFixed(2)}</p>
                )}
                {item.url && (
                  <Link
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm mt-2 inline-flex items-center gap-1"
                  >
                    View Item
                    <ArrowUpRight className="h-4 w-4"/>
                  </Link>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingItem(item)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Item</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditItem} className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                          id="edit-name"
                          value={editingItem?.name || ""}
                          onChange={(e) =>
                            setEditingItem((prev) =>
                              prev ? { ...prev, name: e.target.value } : null
                            )
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={editingItem?.description || ""}
                          onChange={(e) =>
                            setEditingItem((prev) =>
                              prev ? { ...prev, description: e.target.value } : null
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-price">Price</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          step="0.01"
                          value={editingItem?.price || ""}
                          onChange={(e) =>
                            setEditingItem((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    price: e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-url">URL</Label>
                        <Input
                          id="edit-url"
                          type="url"
                          value={editingItem?.url || ""}
                          onChange={(e) =>
                            setEditingItem((prev) =>
                              prev ? { ...prev, url: e.target.value } : null
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-imageUrl">Image URL</Label>
                        <Input
                          id="edit-imageUrl"
                          type="url"
                          value={editingItem?.imageUrl || ""}
                          onChange={(e) =>
                            setEditingItem((prev) =>
                              prev ? { ...prev, imageUrl: e.target.value } : null
                            )
                          }
                        />
                      </div>
                      <Button type="submit">Save Changes</Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setItemToDelete(item)}
                      className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p>Are you sure you want to delete this item?</p>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDeleteDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteItem}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
} 