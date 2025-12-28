"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as React from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import type { Wishlist, WishlistItem, Reservation } from '@/app/types/wishlist';
import { use } from 'react';
import { Pencil, Trash2, ArrowUpRight, Plus, Gift, Lock, Globe, Share2, Settings, ChevronsUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import Link from 'next/link';
import Image from 'next/image';
import { DrawerClose } from "@/app/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { Switch } from "@/app/components/ui/switch";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/app/components/ui/field";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { CURRENCIES, DEFAULT_CURRENCY, formatCurrency } from '@/app/lib/currencies';
import { getBaseUrl } from '@/app/lib/constants';
import { ResponsiveDialog } from '@/app/components/ResponsiveDialog';
import { SettingsForm } from '@/app/components/SettingsForm';
import { ReserveItemForm } from '@/app/components/ReserveItemForm';
import { AddItemDialog } from '@/app/components/AddItemDialog';
import { DeleteItemDialog } from '@/app/components/DeleteItemDialog';

// Define user permissions interface
interface UserPermissions {
  canEdit: boolean;
  isOwner: boolean;
}


// Edit Item Form Component
interface EditItemFormProps {
  editingItem: WishlistItem | null;
  setEditingItem: (item: WishlistItem | null) => void;
  listCurrency: string;
  handleEditItem: (e: React.FormEvent) => void;
  autoFocus?: boolean;
}

function EditItemForm({
  editingItem,
  setEditingItem,
  listCurrency,
  handleEditItem,
  autoFocus = false,
}: EditItemFormProps) {
  const [showMoreDetails, setShowMoreDetails] = useState(true);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && nameInputRef.current && editingItem) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus, editingItem]);

  // Don't render if no item to edit
  if (!editingItem) {
    return <div>No item selected</div>;
  }

  return (
    <form onSubmit={handleEditItem} className="space-y-4">
      {/* Required fields */}
      <div className="grid gap-2">
        <div className="grid gap-1">
          <Label htmlFor="edit-name">Title *</Label>
          <Input 
            id="edit-name"
            ref={nameInputRef}
            value={editingItem.name || ''}
            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
            placeholder="Enter item name"
            autoComplete="off"
            required
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="edit-url">URL</Label>
          <Input 
            id="edit-url"
            type="url"
            value={editingItem.url || ''}
            onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
            placeholder="https://example.com/item"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="edit-price">Price</Label>
          <div className="flex gap-2">
            <Input 
              id="edit-price"
              type="number"
              step="0.01"
              value={editingItem.price || ''}
              onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
              placeholder="Enter price"
              min="0"
              className="flex-1"
              autoComplete="off"
            />
            <Select 
              value={editingItem.currency || listCurrency} 
              onValueChange={(value) => setEditingItem({ ...editingItem, currency: value })}
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
      </div>

      {/* Optional fields in Collapsible */}
      <Collapsible open={showMoreDetails} onOpenChange={setShowMoreDetails}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="w-full justify-between">
            <span>More details</span>
            <span><ChevronsUpDown /></span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="grid gap-1">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea 
              id="edit-description"
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              placeholder="Add a description"
              rows={3}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="edit-image-url">Image URL</Label>
            <Input 
              id="edit-image-url"
              type="url"
              value={editingItem.imageUrl || ''}
              onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              autoComplete="off"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop only - Save button (mobile has sticky footer) */}
      <div className="hidden md:flex justify-end gap-2 pt-2">
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}

export default function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
  const [wishlistTitle, setWishlistTitle] = useState('');
  const [wishlistDescription, setWishlistDescription] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isCustomCodeEditing, setIsCustomCodeEditing] = useState(false);
  const [analytics, setAnalytics] = useState<{
    totalClicks: number;
    clicksByDate: Array<{ date: string; count: number }>;
    recentClicks: Array<{ clickedAt: Date; referer?: string; userAgent?: string }>;
  } | null>(null);
  const [listCurrency, setListCurrency] = useState(DEFAULT_CURRENCY);
  const [isArchived, setIsArchived] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleAddItemDialogChange = (open: boolean) => {
    setAddItemOpen(open);
  };
  
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
      setIsArchived(wishlist.isArchived || false);
      setWishlistTitle(wishlist.title || '');
      setWishlistDescription(wishlist.description || '');
      const currentListCurrency = wishlist.currency || DEFAULT_CURRENCY;
      setListCurrency(currentListCurrency);
    }
  }, [wishlist, resolvedParams.id]);

  // Fetch short link when wishlist loads (only for owners)
  const fetchShortLink = useCallback(async () => {
    if (!wishlist || !userPermissions.isOwner) return;
    
    try {
      const response = await fetch(`/api/shortlinks/${resolvedParams.id}`);
      if (!response.ok) {
        // If 404, short link doesn't exist yet - will be created on first access
        if (response.status === 404) return;
        throw new Error('Failed to fetch short link');
      }
      const data = await response.json();
      setShortUrl(data.shortUrl);
      setShortCode(data.shortCode);
      setCustomCode(data.customCode ? data.shortCode : '');
    } catch (error) {
      console.error('Error fetching short link:', error);
    }
  }, [wishlist, userPermissions.isOwner, resolvedParams.id]);

  // Fetch analytics when wishlist loads (only for owners)
  const fetchAnalytics = useCallback(async () => {
    if (!wishlist || !userPermissions.isOwner) return;
    
    try {
      const response = await fetch(`/api/shortlinks/${resolvedParams.id}/analytics`);
      if (!response.ok) {
        if (response.status === 404) return;
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics({
        totalClicks: data.totalClicks,
        clicksByDate: data.clicksByDate,
        recentClicks: data.recentClicks,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [wishlist, userPermissions.isOwner, resolvedParams.id]);

  // Fetch short link and analytics when wishlist or permissions change
  useEffect(() => {
    if (wishlist && userPermissions.isOwner) {
      fetchShortLink();
      fetchAnalytics();
    }
  }, [wishlist, userPermissions.isOwner, fetchShortLink, fetchAnalytics]);

  const fetchWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get the share token from the URL if it exists
      const url = new URL(window.location.href);
      const shareToken = url.searchParams.get('token');
      
      // Include the token in the request if it exists
      const response = await fetch(`/api/wishlists/${resolvedParams.id}${shareToken ? `?token=${shareToken}` : ''}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch wishlist' }));
        
        // Handle specific error cases
        if (response.status === 404) {
          toast.error('Wishlist not found', {
            description: 'This wishlist does not exist or has been deleted.',
          });
          // Redirect to home after a delay
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          return;
        }
        
        if (response.status === 403) {
          toast.error('Access denied', {
            description: errorData.error || 'You do not have permission to view this wishlist.',
          });
          // Redirect to home after a delay
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to fetch wishlist');
      }
      
      const data = await response.json();
      setWishlist(data);
      setUserPermissions(data.userPermissions || { canEdit: false, isOwner: false });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to fetch wishlist',
      });
      // Redirect to home on unexpected errors
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
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
  
  const handleItemAdded = useCallback((itemId: string) => {
    // Refresh wishlist
    fetchWishlist();
    
    // Scroll to the new item and highlight it
    setTimeout(() => {
      const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
      if (itemElement) {
        itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        itemElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          itemElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 2000);
      }
    }, 100);
  }, [fetchWishlist]);

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

  const handleDeleteItemConfirm = async () => {
    if (!wishlist || !itemToDelete) return;

    setIsDeletingItem(true);
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
    } finally {
      setIsDeletingItem(false);
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
          title: wishlistTitle,
          description: wishlistDescription,
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
  
  // Archive/Unarchive wishlist
  const handleArchiveToggle = async () => {
    try {
      const response = await fetch(`/api/wishlists/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isArchived: !isArchived
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update archive status');
      }
      
      toast.success(isArchived ? 'Wishlist unarchived' : 'Wishlist archived');
      fetchWishlist();
      setShowSettingsDialog(false);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update archive status',
      });
    }
  };
  
  // Copy share link to clipboard (prefer short link if available)
  const copyShareLink = () => {
    const linkToCopy = shortUrl || shareUrl;
    navigator.clipboard.writeText(linkToCopy);
    toast.success('Link copied to clipboard');
  };

  // Update custom short code
  const updateCustomCode = async () => {
    if (!customCode.trim()) {
      toast.error('Error', { description: 'Custom code cannot be empty' });
      return;
    }

    try {
      const response = await fetch(`/api/shortlinks/${resolvedParams.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCode: customCode.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update custom code');
      }

      const data = await response.json();
      setShortUrl(data.shortUrl);
      setShortCode(data.shortCode);
      setIsCustomCodeEditing(false);
      toast.success('Custom code updated');
      fetchShortLink(); // Refresh to get updated data
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update custom code',
      });
    }
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

  const baseUrl = getBaseUrl()
  const wishlistUrl = `${baseUrl}/wishlist/${resolvedParams.id}`

  return (
    <>
      {/* Structured Data for SEO */}
      {wishlist.isPublic && !wishlist.isArchived && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": wishlist.title,
              "description": wishlist.description || `A wishlist with ${wishlist.items.length} items`,
              "url": wishlistUrl,
              "numberOfItems": wishlist.items.length,
              "itemListElement": wishlist.items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Product",
                  "name": item.name,
                  "description": item.description,
                  ...(item.price && {
                    "offers": {
                      "@type": "Offer",
                      "price": item.price,
                      "priceCurrency": item.currency || wishlist.currency || "USD"
                    }
                  }),
                  ...(item.url && { "url": item.url }),
                  ...(item.imageUrl && { "image": item.imageUrl })
                }
              }))
            })
          }}
        />
      )}
      <div className="mx-auto p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading break-words">{wishlist.title}</h1>
            {wishlist.description && (
              <p className="text-gray-600 mt-1 break-words">{wishlist.description}</p>
            )}
          </div>
        
        <div className="flex gap-2 flex-shrink-0">
          {/* Only show settings/share for wishlist owners */}
          {userPermissions.isOwner && (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowSettingsDialog(true)}
                title="Wishlist Settings"
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
          
          {/* Show "Add Item" button only for users with edit permission and not archived */}
          {userPermissions.canEdit && !wishlist.isArchived && (
            <>
              <AddItemDialog
                wishlistId={resolvedParams.id}
                listCurrency={listCurrency}
                open={addItemOpen}
                onOpenChange={handleAddItemDialogChange}
                onItemAdded={handleItemAdded}
                trigger={!isDesktop ? (
                  <Button>
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                ) : undefined}
              />
              {isDesktop && (
                <Button onClick={() => setAddItemOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Privacy indicator */}
      <div className="mb-4 flex items-center gap-2">
        {wishlist.isArchived ? (
          <Badge variant="secondary" className="text-xs">
            Archived
          </Badge>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Settings Dialog/Drawer */}
      <ResponsiveDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        title={
          <div className="flex items-center justify-between">
            <span>Wishlist Settings</span>
            {isArchived && (
              <Badge variant="secondary" className="text-xs">
                Archived
              </Badge>
            )}
          </div>
        }
        contentClassName="sm:max-w-[600px]"
        footer={
          <>
            <Button size="lg" className="w-full sm:w-auto">
              Save Changes
            </Button>
            <Button 
              variant="secondary"
              size="lg"
              onClick={handleArchiveToggle}
              className="w-full sm:w-auto"
            >
              {isArchived ? 'Unarchive' : 'Archive'}
            </Button>
            <Button variant="outline" size="lg" onClick={() => setShowSettingsDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
          </>
        }
      >
        <SettingsForm
          wishlistTitle={wishlistTitle}
          setWishlistTitle={setWishlistTitle}
          wishlistDescription={wishlistDescription}
          setWishlistDescription={setWishlistDescription}
          listCurrency={listCurrency}
          setListCurrency={setListCurrency}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          allowEdits={allowEdits}
          setAllowEdits={setAllowEdits}
          isArchived={isArchived}
          shareUrl={shareUrl}
          shortUrl={shortUrl}
          shortCode={shortCode}
          customCode={customCode}
          setCustomCode={setCustomCode}
          isCustomCodeEditing={isCustomCodeEditing}
          setIsCustomCodeEditing={setIsCustomCodeEditing}
          updateCustomCode={updateCustomCode}
          copyShareLink={copyShareLink}
          analytics={analytics}
          userPermissions={userPermissions}
          isMobile={!isDesktop}
          onDeleteClick={() => {
            setShowSettingsDialog(false);
            setShowDeleteDialog(true);
          }}
        />
      </ResponsiveDialog>

      {/* Delete Wishlist Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Wishlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this wishlist? This action cannot be undone.
              All items and reservations will be permanently deleted.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWishlist} className="w-full sm:w-auto">
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
            <Card key={item.id} data-item-id={item.id} className="group relative gap-0 py-0">
              {/* Show edit/delete buttons only for users with edit permission and not archived */}
              {userPermissions.canEdit && !wishlist.isArchived && (
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
                <div className="aspect-square rounded-t-lg overflow-hidden relative">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="p-4 object-cover"
                    unoptimized
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
                                
                                if (reservation?.allowDisclosure === true) {
                                  const identity = reservation.displayName || reservation.reserverEmail || 'Anonymous';
                                  return identity;
                                }
                                
                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      !wishlist.isArchived && (
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
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog/Drawer */}
      <ResponsiveDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Item"
        footer={!isDesktop ? (
          <>
            <Button size="lg" onClick={handleEditItem} className="w-full">Save Changes</Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </>
        ) : undefined}
      >
        <EditItemForm
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          listCurrency={listCurrency}
          handleEditItem={handleEditItem}
          autoFocus={isDesktop}
        />
      </ResponsiveDialog>

      {/* Delete Item Dialog */}
      <DeleteItemDialog
        item={itemToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteItemConfirm}
        isLoading={isDeletingItem}
      />

      {/* Reserve Dialog/Drawer */}
      <ResponsiveDialog
        open={reserveDialogOpen}
        onOpenChange={setReserveDialogOpen}
        title="Reserve Item"
        footer={!isDesktop ? (
          <>
            <Button 
              type="submit"
              size="lg"
              form="reserve-item-form"
              disabled={allowDisclosure && !reserverEmail && !displayName}
              className="w-full"
            >
              Reserve
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </>
        ) : undefined}
      >
        <ReserveItemForm
          reserverEmail={reserverEmail}
          setReserverEmail={setReserverEmail}
          displayName={displayName}
          setDisplayName={setDisplayName}
          passphrase={passphrase}
          setPassphrase={setPassphrase}
          allowDisclosure={allowDisclosure}
          setAllowDisclosure={setAllowDisclosure}
          isMobile={!isDesktop}
          autoFocus={isDesktop}
          onSubmit={handleReserveItem}
        />
        {isDesktop && (
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              type="submit"
              form="reserve-item-form"
              disabled={allowDisclosure && !reserverEmail && !displayName}
            >
              Reserve
            </Button>
          </div>
        )}
      </ResponsiveDialog>
    </div>
    </>
  );
} 