"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { DrawerClose } from "@/app/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { Field, FieldGroup, FieldLabel } from "@/app/components/ui/field";
import { ResponsiveDialog } from "@/app/components/ResponsiveDialog";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { CURRENCIES } from "@/app/lib/currencies";
import { toast } from "sonner";
import { ChevronsUpDown } from "lucide-react";

interface AddItemDialogProps {
  wishlistId: string;
  listCurrency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: (itemId: string) => void;
  trigger?: React.ReactNode;
}

export function AddItemDialog({
  wishlistId,
  listCurrency,
  open,
  onOpenChange,
  onItemAdded,
  trigger,
}: AddItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: listCurrency,
    url: "",
    imageUrl: "",
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        description: "",
        price: "",
        currency: listCurrency,
        url: "",
        imageUrl: "",
      });
      setShowMoreDetails(false);
    } else if (open && isDesktop && nameInputRef.current) {
      // Auto-focus on desktop
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open, listCurrency, isDesktop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Only include currency if it's different from list's currency
      const itemCurrency = formData.currency !== listCurrency ? formData.currency : undefined;
      
      const response = await fetch(`/api/wishlists/${wishlistId}/items`, {
        method: "POST",
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
        throw new Error("Failed to add item");
      }

      const data = await response.json();
      const newItemId = data.item?.id;

      onOpenChange(false);
      toast.success("Item added successfully");
      
      // Notify parent to handle scrolling and highlighting
      if (newItemId) {
        onItemAdded(newItemId);
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to add item",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Item"
      trigger={trigger}
      footer={
        isDesktop ? (
          <Button 
            type="submit"
            form="add-item-form"
            disabled={isLoading}
          >
            Save
          </Button>
        ) : (
          <>
            <Button 
              type="submit"
              size="lg"
              form="add-item-form"
              disabled={isLoading}
              className="w-full"
            >
              Save
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" size="lg" className="w-full" disabled={isLoading}>
                Cancel
              </Button>
            </DrawerClose>
          </>
        )
      }
    >
      <form id="add-item-form" onSubmit={handleSubmit}>
        <FieldGroup className="py-2 space-y-0 gap-4">
          <Field>
            <FieldLabel htmlFor="name">Title *</FieldLabel>
            <Input 
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter item name"
              autoComplete="off"
              required
            />
          </Field>
          
          <Field>
            <FieldLabel htmlFor="url">URL</FieldLabel>
            <Input 
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/item"
              autoComplete="off"
            />
          </Field>
          
          <Field>
            <FieldLabel htmlFor="price">Price</FieldLabel>
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
                  className="h-9 min-h-9 max-h-9 py-1 text-base md:text-sm leading-none w-1/2"
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
          </Field>

          {/* Optional fields in Collapsible */}
          <Collapsible open={showMoreDetails} onOpenChange={setShowMoreDetails}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between">
                <span>More details</span>
                <span><ChevronsUpDown /></span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <FieldGroup className="pt-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea 
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description"
                    rows={3}
                  />
                </Field>
                
                <Field>
                  <FieldLabel htmlFor="imageUrl">Image URL</FieldLabel>
                  <Input 
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    autoComplete="off"
                  />
                </Field>
              </FieldGroup>
            </CollapsibleContent>
          </Collapsible>
        </FieldGroup>
      </form>
    </ResponsiveDialog>
  );
}

