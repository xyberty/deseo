"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/app/components/ui/drawer';
import { Button } from '@/app/components/ui/button';
import { useMediaQuery } from '@/app/hooks/use-media-query';
import { cn } from '@/lib/utils';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
  maxHeight?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  children,
  trigger,
  footer,
  contentClassName,
  maxHeight = '90vh',
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("sm:max-w-[425px] flex flex-col", contentClassName)} style={{ maxHeight }}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6">
            {children}
          </div>
          {footer && (
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
              {footer}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent style={{ maxHeight }} className="flex flex-col">
        <div className="mx-auto w-full max-w-sm flex flex-col flex-1 min-h-0">
          <DrawerHeader className="text-left pb-2 px-4 pt-2 flex-shrink-0">
            <DrawerTitle className="text-base">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4 flex-1 min-h-0">
            {children}
          </div>
          {footer && (
            <DrawerFooter className="sticky bottom-0 pt-4 pb-safe bg-background flex-shrink-0">
              {footer}
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

