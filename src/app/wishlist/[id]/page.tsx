"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import type { Wishlist, WishlistItem, Reservation } from '@/app/types/wishlist';
import { use } from 'react';
import { Pencil, Trash2, ArrowUpRight, Plus, Gift, Lock, Globe, Share2, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { CURRENCIES, DEFAULT_CURRENCY, formatCurrency, getCurrencyByAlpha3 } from '@/app/lib/currencies';

// Define user permissions interface
interface UserPermissions {
  canEdit: boolean;
  isOwner: boolean;
}

export default function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCurrency, setNewItemCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [reserverEmail, setReserverEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [allowDisclosure, setAllowDisclosure] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [itemToReserve, setItemToReserve] = useState<WishlistItem | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ canEdit: false, isOwner: false });
  const [isPublic, setIsPublic] = useState(false);
  const [allowEdits, setAllowEdits] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [listCurrency, setListCurrency] = useState(DEFAULT_CURRENCY);
  
  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettingsDialog(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);
  
  // Set share URL when wishlist loads
  useEffect(() => {
    if (wishlist) {
      // Ensure we have a share token
      if (!wishlist.shareToken) {
        // If no share token exists, the API will generate one on the next request
        setShareUrl(`${window.location.origin}/wishlist/${resolvedParams.id}`);
      } else {
        setShareUrl(`${window.location.origin}/wishlist/${resolvedParams.id}?token=${wishlist.shareToken}`);
      }
      setIsPublic(wishlist.isPublic);
      setAllowEdits(wishlist.allowEdits);
      const currentListCurrency = wishlist.currency || DEFAULT_CURRENCY;
      setListCurrency(currentListCurrency);
      // Update new item currency to match list currency when wishlist loads
      setNewItemCurrency(currentListCurrency);
    }
  }, [wishlist, resolvedParams.id]);

  const fetchWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get the share token from the URL if it exists
      const url = new URL(window.location.href);
      const shareToken = url.searchParams.get('token');
      
      // Include the token in the request if it exists
      const response = await fetch(`/api/wishlists/${resolvedParams.id}${shareToken ? `?token=${shareToken}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      const data = await response.json();
      setWishlist(data);
      setUserPermissions(data.userPermissions || { canEdit: false, isOwner: false });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to fetch wishlist',
      });
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id]);

  const fetchUserReservations = useCallback(async () => {
    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}/reserve`);
      if (!response.ok) throw new Error('Failed to fetch reservations');
      const data = await response.json();
      setUserReservations(data.reservations || []);
    } catch (error) {
      console.error('Error fetching user reservations:', error);
    }
    }, [resolvedParams.id]);
  
  // Initial data fetch
  useEffect(() => {
    fetchWishlist();
    fetchUserReservations();
  }, [fetchWishlist, fetchUserReservations]);
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlist) return;

    try {
      // Only include currency if it's different from list's currency
      const itemCurrency = newItemCurrency !== listCurrency ? newItemCurrency : undefined;
      
      const response = await fetch(`/api/wishlists/${resolvedParams.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          description: newItemDescription,
          price: newItemPrice ? parseFloat(newItemPrice) : undefined,
          currency: itemCurrency,
          url: newItemUrl,
          imageUrl: newItemImageUrl
        }),
      });

      if (!response.ok) throw new Error('Failed to add item');

      // Reset form
      setNewItemName('');
      setNewItemDescription('');
      setNewItemPrice('');
      setNewItemCurrency(listCurrency);
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
      // Only include currency if it's different from list's currency
      const itemCurrency = editingItem.currency !== listCurrency ? editingItem.currency : undefined;
      
      const response = await fetch(`/api/wishlists/${resolvedParams.id}/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.name,
          description: editingItem.description,
          price: editingItem.price,
          currency: itemCurrency,
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

  const handleReserveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlist || !itemToReserve) return;

    const reservationData = {
      itemId: itemToReserve.id,
      reserverEmail: reserverEmail || null,
      displayName: displayName || null,
      passphrase: passphrase || null,
      allowDisclosure
    };

    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) throw new Error('Failed to reserve item');

      setReserveDialogOpen(false);
      setItemToReserve(null);
      setReserverEmail('');
      setDisplayName('');
      setAllowDisclosure(false);
      setPassphrase('');
      // Refresh both wishlist and user reservations
      fetchWishlist();
      fetchUserReservations();
      toast.success('Item reserved successfully');
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to reserve item',
      });
    }
  };

  // Update privacy settings
  const updatePrivacySettings = async () => {
    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isPublic, 
          allowEdits,
          currency: listCurrency
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }
      
      toast.success('Settings updated');
      fetchWishlist();
      setShowSettingsDialog(false);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update settings',
      });
    }
  };
  
  // Copy share link to clipboard
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard');
  };

  const handleDeleteWishlist = async () => {
    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete wishlist');
      }

      toast.success('Wishlist deleted successfully');
      // Redirect to home page after deletion
      window.location.href = '/';
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to delete wishlist',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Wishlist not found</h1>
          <p className="text-gray-500 mt-2">The wishlist you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">{wishlist.title}</h1>
          {wishlist.description && (
            <p className="text-gray-600 mt-1">{wishlist.description}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Only show settings/share for wishlist owners */}
          {userPermissions.isOwner && (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowSettingsDialog(true)}
                title="Privacy Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={copyShareLink}
                title="Copy Share Link"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* Show "Add Item" button only for users with edit permission */}
          {userPermissions.canEdit && (
            <Popover>
              <PopoverTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Add Item</h4>
                    <p className="text-sm text-muted-foreground">
                      Add a new item to your wishlist.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid gap-1">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea 
                        id="description"
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        placeholder="Add a description"
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="price">Price (optional)</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="price"
                          type="number"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          placeholder="Enter price"
                          min="0"
                          step="0.01"
                          className="flex-1"
                        />
                        <Select 
                          value={newItemCurrency} 
                          onValueChange={setNewItemCurrency}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((curr) => (
                              <SelectItem key={curr.alpha3} value={curr.alpha3}>
                                {curr.alpha3} — {curr.symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="url">URL (optional)</Label>
                      <Input 
                        id="url"
                        value={newItemUrl}
                        onChange={(e) => setNewItemUrl(e.target.value)}
                        placeholder="https://example.com/item"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="imageUrl">Image URL (optional)</Label>
                      <Input 
                        id="imageUrl"
                        value={newItemImageUrl}
                        onChange={(e) => setNewItemImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <Button onClick={handleAddItem}>Add Item</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Privacy indicator */}
      <div className="mb-4 flex items-center gap-2">
        {wishlist.isPublic ? (
          <div className="flex items-center text-sm text-gray-500">
            <Globe className="h-4 w-4 mr-1" />
            Public wishlist
          </div>
        ) : (
          <div className="flex items-center text-sm text-gray-500">
            <Lock className="h-4 w-4 mr-1" />
            Private wishlist
          </div>
        )}
        
        {wishlist.allowEdits && (
          <Badge variant="outline" className="text-xs">
            Anyone can edit
          </Badge>
        )}
      </div>

      {/* Settings dialog for owners */}
      {showSettingsDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
            <button
              onClick={() => setShowSettingsDialog(false)}
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
            <h2 className="text-xl font-heading font-bold mb-4">Wishlist Settings</h2>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Privacy</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="public-toggle" className="font-medium">Public Wishlist</Label>
                    <p className="text-sm text-gray-500">Anyone with the link can view</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edits-toggle" className="font-medium">Allow Edits</Label>
                    <p className="text-sm text-gray-500">Anyone can add or edit items</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowEdits}
                    onChange={(e) => setAllowEdits(e.target.checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Currency</h3>
                <div className="grid gap-2">
                  <Label htmlFor="currency-select">Default Currency</Label>
                  <Select value={listCurrency} onValueChange={setListCurrency}>
                    <SelectTrigger id="currency-select">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.alpha3} value={curr.alpha3}>
                          {curr.alpha3} — {curr.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">Items will use this currency by default</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sharing</h3>
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button variant="outline" onClick={copyShareLink}>Copy</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-500">Once you delete a wishlist, there is no going back. Please be certain.</p>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setShowSettingsDialog(false);
                      setShowDeleteDialog(true);
                    }}
                  >
                    Delete Wishlist
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={updatePrivacySettings}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Wishlist Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Wishlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this wishlist? This action cannot be undone.
              All items and reservations will be permanently deleted.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWishlist}>
              Delete Wishlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {wishlist.items.length === 0 ? (
          <div className="col-span-full text-center p-10 border border-dashed rounded-lg">
            <p className="text-gray-500">
              {userPermissions.canEdit 
                ? "This wishlist is empty. Add your first item!" 
                : "This wishlist is empty."}
            </p>
          </div>
        ) : (
          wishlist.items.map((item) => (
            <Card key={item.id} className="group relative gap-0 py-0">
              {/* Show edit/delete buttons only for users with edit permission */}
              {userPermissions.canEdit && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Initialize editing item with currency (use list currency if item doesn't have one)
                      setEditingItem({
                        ...item,
                        currency: item.currency || listCurrency
                      });
                      setEditDialogOpen(true);
                    }}
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 hover:text-primary transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setItemToDelete(item);
                      setDeleteDialogOpen(true);
                    }}
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Card content */}
              {item.imageUrl && (
                <div className="aspect-square rounded-t-lg overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="p-4 w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                {item.description && (
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                {item.price && (
                  <p className="text-green-600 font-medium">
                    {formatCurrency(item.price, item.currency || wishlist.currency || DEFAULT_CURRENCY)}
                  </p>
                )}
                <div className="flex justify-between items-center mt-2">
                  {item.url && (
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm inline-flex items-center gap-1"
                    >
                      View Item
                      <ArrowUpRight className="h-3 w-3"/>
                    </Link>
                  )}
                  <div className="flex items-center gap-2">
                    {wishlist.reservations?.some(r => r.itemId === item.id) ? (
                      userReservations.some(r => r.itemId === item.id) ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Gift className="h-4 w-4" />
                          <span>You</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Reserved
                          </Badge>
                          {userPermissions.isOwner && (
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const reservation = wishlist.reservations?.find(r => r.itemId === item.id);
                                console.log('Found reservation for item:', item.id, {
                                  reservation,
                                  isOwner: userPermissions.isOwner,
                                  allowDisclosure: reservation?.allowDisclosure,
                                  displayName: reservation?.displayName,
                                  reserverEmail: reservation?.reserverEmail
                                });
                                
                                if (reservation?.allowDisclosure === true) {
                                  const identity = reservation.displayName || reservation.reserverEmail || 'Anonymous';
                                  console.log('Showing identity:', identity);
                                  return identity;
                                }
                                
                                console.log('Not showing identity - allowDisclosure:', reservation?.allowDisclosure);
                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!wishlist.reservations?.some(r => r.itemId === item.id)) {
                            setItemToReserve(item);
                            setReserveDialogOpen(true);
                          }
                        }}
                        className="h-8"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Reserve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editingItem?.name || ''}
                onChange={(e) => setEditingItem(prev => prev ? {...prev, name: e.target.value} : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editingItem?.description || ''}
                onChange={(e) => setEditingItem(prev => prev ? {...prev, description: e.target.value} : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editingItem?.price || ''}
                  onChange={(e) => setEditingItem(prev => prev ? {...prev, price: parseFloat(e.target.value) || 0} : null)}
                  className="flex-1"
                />
                <Select 
                  value={editingItem?.currency || listCurrency} 
                  onValueChange={(value) => setEditingItem(prev => prev ? {...prev, currency: value} : null)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.alpha3} value={curr.alpha3}>
                        {curr.alpha3} — {curr.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-url">URL (optional)</Label>
              <Input
                id="edit-url"
                type="url"
                value={editingItem?.url || ''}
                onChange={(e) => setEditingItem(prev => prev ? {...prev, url: e.target.value} : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image-url">Image URL (optional)</Label>
              <Input
                id="edit-image-url"
                type="url"
                value={editingItem?.imageUrl || ''}
                onChange={(e) => setEditingItem(prev => prev ? {...prev, imageUrl: e.target.value} : null)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reserve Dialog */}
      <Dialog open={reserveDialogOpen} onOpenChange={setReserveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReserveItem}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reserver-email">Your Email (optional)</Label>
                <Input
                  id="reserver-email"
                  type="email"
                  value={reserverEmail}
                  onChange={(e) => setReserverEmail(e.target.value)}
                  placeholder="Enter your email to receive updates"
                />
                <p className="text-xs text-gray-500">
                  {allowDisclosure && !reserverEmail && !displayName ? 
                    "Please provide either an email or display name if you want to be identified" : 
                    "Your email will only be visible to the wishlist creator if you allow disclosure"}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="display-name">Display Name (optional)</Label>
                <Input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you'd like to be identified"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="passphrase">Passphrase (optional)</Label>
                <Input
                  id="passphrase"
                  type="text"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="A secret word to identify your reservation"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allow-disclosure"
                  checked={allowDisclosure}
                  onChange={(e) => setAllowDisclosure(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="allow-disclosure" className="text-sm">
                  Allow the creator to see my identity
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReserveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={allowDisclosure && !reserverEmail && !displayName}
              >
                Reserve
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 