"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Wishlist, WishlistItem } from '@/app/types/wishlist';
import { Button } from '@/app/components/ui/button';
import { Gift, PenSquare, List, Clock, ChevronDown, ChevronUp, Archive } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/app/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { MagicLinkForm } from '@/app/components/MagicLinkForm';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [createdWishlists, setCreatedWishlists] = useState<Wishlist[]>([]);
  const [archivedWishlists, setArchivedWishlists] = useState<Wishlist[]>([]);
  const [sharedWishlists, setSharedWishlists] = useState<Wishlist[]>([]);
  const [reservations, setReservations] = useState<{wishlistId: string, title: string, items: WishlistItem[]}[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch wishlists created by the user
      const createdResponse = await fetch('/api/wishlists');
      const createdData = await createdResponse.json();
      
      if (createdResponse.ok) {
        setCreatedWishlists(createdData.created || []);
        setArchivedWishlists(createdData.archived || []);
      }
      
      // Fetch wishlists shared with the user
      const sharedResponse = await fetch('/api/wishlists/shared');
      const sharedData = await sharedResponse.json();
      
      if (sharedResponse.ok) {
        setSharedWishlists(sharedData.shared || []);
      }
      
      // Fetch user's reservations
      const reservationsResponse = await fetch('/api/reservations');
      const reservationsData = await reservationsResponse.json();
      
      if (reservationsResponse.ok) {
        setReservations(reservationsData.reservations || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const hasCreatedWishlists = createdWishlists.length > 0;
  const hasArchivedWishlists = archivedWishlists.length > 0;
  const hasSharedWishlists = sharedWishlists.length > 0;
  const hasReservations = reservations.length > 0;
  const hasAnyContent = hasCreatedWishlists || hasArchivedWishlists || hasSharedWishlists || hasReservations;
  const hasAnonymousWishlists = !authLoading && !isAuthenticated && hasCreatedWishlists;

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      {!hasAnyContent && (
        <div className="text-center p-12 border border-dashed rounded-lg my-8">
          <h2 className="text-xl font-medium mb-2">Welcome to Deseo!</h2>
          <p className="text-gray-500 mb-6">
            Your dashboard is empty. Start by creating a wishlist or viewing shared wishlists.
          </p>
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <Link href="/create" className="w-full">
              <Button className="w-full">
                <PenSquare className="h-4 w-4 mr-2" />
                Create My First Wishlist
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      {/* My Wishlists Section */}
      {(hasCreatedWishlists || hasArchivedWishlists) && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative inline-flex items-center">
              {hasAnonymousWishlists ? (
                <button
                  onClick={() => setSavePromptOpen(true)}
                  className="cursor-pointer hover:opacity-80 transition-opacity relative"
                  aria-label="Save wishlists to account"
                >
                  <PenSquare className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-violet-500 rounded-full border-1 border-white shadow-lg z-12"></span>
                </button>
              ) : (
                <PenSquare className="h-5 w-5" />
              )}
            </div>
            <h2 className="text-xl font-bold">My Wishlists</h2>
          </div>
          
          {/* Active Wishlists */}
          {hasCreatedWishlists && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {createdWishlists.map(wishlist => (
                <Card key={wishlist._id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">{wishlist.title}</CardTitle>
                    {wishlist.description && (
                      <CardDescription className="line-clamp-2">{wishlist.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <List className="h-4 w-4" />
                      <span>{wishlist.items.length} items</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {wishlist.isPublic && (
                        <Badge variant="outline">Public</Badge>
                      )}
                      {wishlist.allowEdits && (
                        <Badge variant="outline">Editable</Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t flex justify-between">
                    <div className="text-xs text-gray-500">
                      <Clock className="h-3 w-3 inline-block mr-1" />
                      Created {new Date(wishlist.createdAt).toLocaleDateString()}
                    </div>
                    <Link href={`/wishlist/${wishlist._id}`}>
                      <Button size="sm">View</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Archived Wishlists Section */}
          {hasArchivedWishlists && (
            <div className="mt-6">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <Archive className="h-4 w-4" />
                <span className="font-medium">Archived Wishlists ({archivedWishlists.length})</span>
                {showArchived ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {showArchived && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedWishlists.map(wishlist => (
                    <Card key={wishlist._id} className="overflow-hidden opacity-75">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{wishlist.title}</CardTitle>
                          <Badge variant="secondary" className="text-xs">Archived</Badge>
                        </div>
                        {wishlist.description && (
                          <CardDescription className="line-clamp-2">{wishlist.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <List className="h-4 w-4" />
                          <span>{wishlist.items.length} items</span>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 border-t flex justify-between">
                        <div className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline-block mr-1" />
                          Created {new Date(wishlist.createdAt).toLocaleDateString()}
                        </div>
                        <Link href={`/wishlist/${wishlist._id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Shared Wishlists Section */}
      {hasSharedWishlists && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <List className="h-5 w-5" />
            <h2 className="text-xl font-bold">Shared Wishlists</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedWishlists.map(wishlist => (
              <Card key={wishlist._id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg">{wishlist.title}</CardTitle>
                  {wishlist.description && (
                    <CardDescription className="line-clamp-2">{wishlist.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <List className="h-4 w-4" />
                    <span>{wishlist.items.length} items</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 border-t flex justify-between">
                  <div className="text-xs text-gray-500">
                    <Clock className="h-3 w-3 inline-block mr-1" />
                    Updated {new Date(wishlist.updatedAt).toLocaleDateString()}
                  </div>
                  <Link href={`/wishlist/${wishlist._id}`}>
                    <Button size="sm">View</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* My Reservations Section */}
      {hasReservations && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5" />
            <h2 className="text-xl font-bold">My Reservations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map(reservation => (
              <Card key={reservation.wishlistId} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg">{reservation.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {reservation.items.length} reserved items
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {reservation.items.slice(0, 3).map(item => (
                      <li key={item.id} className="text-sm truncate">{item.name}</li>
                    ))}
                    {reservation.items.length > 3 && (
                      <li className="text-sm text-gray-500">...and {reservation.items.length - 3} more</li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter className="p-4 pt-0 border-t">
                  <Link href={`/wishlist/${reservation.wishlistId}`} className="w-full">
                    <Button size="sm" className="w-full">View Wishlist</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Save to Account Dialog */}
      <Dialog open={savePromptOpen} onOpenChange={setSavePromptOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Save Your Wishlists</DialogTitle>
            <DialogDescription className="text-sm">
              Sign in with your email to access your wishlists from any device, anytime.
            </DialogDescription>
          </DialogHeader>
          <MagicLinkForm onSuccess={() => setSavePromptOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
} 