"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { MagicLinkForm } from './MagicLinkForm';
import { toast } from 'sonner';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, refresh } = useAuth();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const routes = [
    { href: '/', label: 'Home' },
    // { href: '/create', label: 'Create Wishlist' },
    // { href: '/dashboard', label: 'Dashboard' },
  ];

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }

      toast.success('Signed out successfully');
      await refresh();
      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to sign out',
      });
    }
  };

  const handleRestoreSuccess = () => {
    setRestoreDialogOpen(false);
    refresh();
  };

  return (
    <>
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/" 
              className="font-montserrat font-bold text-xl text-primary hover:text-primary/90 transition-colors"
            >
              Deseo
            </Link>
            
            <div className="flex items-center space-x-6">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    pathname === route.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {route.label}
                </Link>
              ))}
              
              {!isLoading && (
                <>
                  {!isAuthenticated ? (
                    <Button
                      variant="outline"
                      onClick={() => setRestoreDialogOpen(true)}
                    >
                      Restore My Wishlists
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  )}
                </>
              )}
              
              <Link href="/create">
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                  Create Wishlist
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore My Wishlists</DialogTitle>
            <DialogDescription>
              Enter your email to receive a magic link and access your wishlists from this device.
            </DialogDescription>
          </DialogHeader>
          <MagicLinkForm onSuccess={handleRestoreSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
} 