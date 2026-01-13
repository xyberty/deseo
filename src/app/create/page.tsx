"use client";

import { useState, FormEvent, ChangeEvent } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import type { WishlistItem } from '../types/wishlist';
import { CURRENCIES, DEFAULT_CURRENCY } from '../lib/currencies';
import { getBaseUrl } from '../lib/constants';

export default function CreateWishlist() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [items] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/wishlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, currency, items }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create wishlist');
      }

      const data = await response.json();
      
      if (!data.id) {
        throw new Error('Wishlist created but no ID returned');
      }
      
      toast.success('Wishlist created!', {
        description: 'Your wishlist has been created successfully.',
      });
      
      // Small delay to ensure cookie is set before redirect
      setTimeout(() => {
        window.location.href = `/wishlist/${data.id}`;
      }, 100);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Create Wishlist - Deseo",
            "description": "Create a new wishlist to share with friends and family",
            "url": `${getBaseUrl()}/create`,
          })
        }}
      />
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Create Wishlist</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="My Birthday Wishlist"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              placeholder="A list of things I'd love to receive..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">
              Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
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

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Wishlist'}
          </Button>
        </form>
      </div>
    </>
  );
}
