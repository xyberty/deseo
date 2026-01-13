"use client";

import { Button } from "@/app/components/ui/button";
import { DrawerClose } from "@/app/components/ui/drawer";
import { ResponsiveDialog } from "@/app/components/ResponsiveDialog";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import type { WishlistItem } from "@/app/types/wishlist";

interface DeleteItemDialogProps {
  item: WishlistItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteItemDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteItemDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Item"
      contentClassName="sm:max-w-lg"
      footer={!isDesktop ? (
        <>
          <Button 
            variant="destructive"
            size="lg"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full"
          >
            Delete
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" size="lg" className="w-full" disabled={isLoading}>
              Cancel
            </Button>
          </DrawerClose>
        </>
      ) : undefined}
    >
      <div className="py-4">
        <p>
          Are you sure you want to delete &quot;{item?.name}&quot;? This action cannot be undone.
        </p>
      </div>
      {isDesktop && (
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Delete
          </Button>
        </div>
      )}
    </ResponsiveDialog>
  );
}

