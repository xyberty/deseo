"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Plus, LogOut, Menu, X, Home } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import { useState, useEffect } from 'react';
import { MagicLinkForm } from './MagicLinkForm';
import { ResponsiveDialog } from './ResponsiveDialog';
import { DrawerClose } from './ui/drawer';
import { useMediaQuery } from '@/app/hooks/use-media-query';
import { toast } from 'sonner';
import { APP_NAME } from '@/app/lib/constants';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, refresh } = useAuth();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

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

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingMagicLink(true);

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicLinkEmail }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send magic link');
      }

      toast.success('Magic link sent!', {
        description: 'Please check your email for the sign-in link.',
      });

      setRestoreDialogOpen(false);
      setMagicLinkEmail('');
      refresh();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleRestoreDialogClose = (open: boolean) => {
    setRestoreDialogOpen(open);
    if (!open) {
      setMagicLinkEmail('');
    }
  };

  const handleRestoreClick = () => {
    setRestoreDialogOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="w-full border-b bg-background sticky top-0 z-40">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/" 
              className="flex items-center gap-2 font-montserrat font-bold text-xl text-primary hover:text-primary/90 transition-colors"
            >
              <Image 
                src="/deseo-64x64.png" 
                alt="Deseo logo" 
                width={32} 
                height={32}
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
              <span>{APP_NAME}</span>
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

      <ResponsiveDialog
        open={restoreDialogOpen}
        onOpenChange={handleRestoreDialogClose}
        title="Restore My Wishlists"
        footer={!isDesktop ? (
          <>
            <Button 
              type="submit"
              size="lg"
              form="magic-link-form"
              disabled={isSendingMagicLink}
              className="w-full"
            >
              {isSendingMagicLink ? 'Sending...' : 'Send Magic Link'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </>
        ) : undefined}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter your email to receive a magic link and access your wishlists from this device.
          </p>
          <MagicLinkForm
            email={magicLinkEmail}
            setEmail={setMagicLinkEmail}
            isLoading={isSendingMagicLink}
            isMobile={!isDesktop}
            autoFocus={isDesktop}
            onSubmit={handleSendMagicLink}
          />
          {isDesktop && (
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="submit"
                form="magic-link-form"
                disabled={isSendingMagicLink}
              >
                {isSendingMagicLink ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </div>
          )}
        </div>
      </ResponsiveDialog>
    </>
  );
} 