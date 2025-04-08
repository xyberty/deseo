"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Plus } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const routes = [
    { href: '/', label: 'Home' },
    // { href: '/create', label: 'Create Wishlist' },
    // { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
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
  );
} 