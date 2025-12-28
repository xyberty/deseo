"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { DrawerClose } from "@/app/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/app/components/ui/field";
import { ResponsiveDialog } from "@/app/components/ResponsiveDialog";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { CURRENCIES } from "@/app/lib/currencies";
import { toast } from "sonner";
import { ChevronsUpDown } from "lucide-react";
import type { WishlistItem } from "@/app/types/wishlist";

interface EditItemDialogProps {
  item: WishlistItem;
  wishlistId: string;
  listCurrency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (updatedItem: WishlistItem) => void;
  onItemDeleted: (itemId: string) => void;
}

export function EditItemDialog({
  item,
  wishlistId,
  listCurrency,
  open,
  onOpenChange,
  onItemUpdated,
  onItemDeleted,
}: EditItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [showMoreDetails, setShowMoreDetails] = useState(true);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || "",
    price: item.price ? String(item.price) : "",
    currency: item.currency || listCurrency,
    url: item.url || "",
    imageUrl: item.imageUrl || "",
  });

  // Reset form when item changes or dialog opens/closes
  useEffect(() => {
    if (open && item) {
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price ? String(item.price) : "",
        currency: item.currency || listCurrency,
        url: item.url || "",
        imageUrl: item.imageUrl || "",
      });
      setShowMoreDetails(true);
      // Auto-focus on desktop
      if (isDesktop && nameInputRef.current) {
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 100);
      }
    }
  }, [open, item, listCurrency, isDesktop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Only include currency if it's different from list's currency
      const itemCurrency = formData.currency !== listCurrency ? formData.currency : undefined;
      
      const response = await fetch(`/api/wishlists/${wishlistId}/items/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          price: formData.price ? parseFloat(formData.price) : undefined,
          currency: itemCurrency,
          url: formData.url || undefined,
          imageUrl: formData.imageUrl || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      const updatedItem: WishlistItem = {
        ...item,
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        currency: itemCurrency,
        url: formData.url || undefined,
        imageUrl: formData.imageUrl || undefined,
      };

      onItemUpdated(updatedItem);
      onOpenChange(false);
      toast.success("Item updated successfully");
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/wishlists/${wishlistId}/items/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      onItemDeleted(item.id);
      onOpenChange(false);
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Item"
      footer={!isDesktop ? (
        <>
          <Button 
            type="submit"
            size="lg"
            form="edit-item-form"
            disabled={isLoading}
            className="w-full"
          >
            Save Changes
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" size="lg"className="w-full" disabled={isLoading}>
              Cancel
            </Button>
          </DrawerClose>
        </>
      ) : undefined}
    >
      <form id="edit-item-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Required fields */}
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label htmlFor="name">Title *</Label>
            <Input 
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter item name"
              autoComplete="off"
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="url">URL</Label>
            <Input 
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/item"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="price">Price</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Enter price"
                min="0"
                step="0.01"
                className="flex-1"
                autoComplete="off"
              />
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger 
                  className="h-9 min-h-9 max-h-9 py-1 text-base md:text-sm leading-none w-32"
                  style={{ height: '36px', paddingTop: '4px', paddingBottom: '4px' }}
                >
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
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a description"
                rows={3}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input 
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                autoComplete="off"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Desktop only - Action buttons (mobile has sticky footer) */}
        {isDesktop ? (
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <Button
              type="button"
              size="lg"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full"
            >
              Delete
            </Button>
          </div>
        )}
      </form>
    </ResponsiveDialog>
  );
} 