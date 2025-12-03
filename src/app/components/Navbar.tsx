"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Plus, LogOut, Menu, X, Home } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { MagicLinkForm } from './MagicLinkForm';
import { toast } from 'sonner';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, refresh } = useAuth();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const routes = [
    { href: '/', label: 'Home', icon: Home },
    // { href: '/create', label: 'Create Wishlist' },
    // { href: '/dashboard', label: 'Dashboard' },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      setMobileMenuOpen(false);
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

  const handleRestoreClick = () => {
    setRestoreDialogOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/" 
              className="font-montserrat font-bold text-xl text-primary hover:text-primary/90 transition-colors"
            >
              Deseo
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
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
                      onClick={handleRestoreClick}
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
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wishlist
                </Button>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-center gap-2 md:hidden">
              {/* Create Button - Always Visible */}
              <Link href="/create">
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Create Wishlist</span>
                </Button>
              </Link>
              
              {/* Burger Menu Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === route.href
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  )}
                >
                  {route.label}
                </Link>
              ))}
              
              {!isLoading && (
                <>
                  {!isAuthenticated ? (
                    <button
                      onClick={handleRestoreClick}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors text-left"
                    >
                      Restore My Wishlists
                    </button>
                  ) : (
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Restore My Wishlists</DialogTitle>
            <DialogDescription className="text-sm">
              Enter your email to receive a magic link and access your wishlists from this device.
            </DialogDescription>
          </DialogHeader>
          <MagicLinkForm onSuccess={handleRestoreSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
} 