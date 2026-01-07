"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/app/components/ui/drawer';
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
  const [viewportHeight, setViewportHeight] = React.useState<number | null>(null);
  const drawerContentRef = React.useRef<HTMLDivElement>(null);

  // Track visual viewport changes for keyboard handling on mobile
  React.useEffect(() => {
    if (isDesktop || typeof window === 'undefined') return;

    const updateViewportHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    // Initial height
    updateViewportHeight();

    // Listen to visual viewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      // Fallback for browsers without visual viewport API
      window.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, [isDesktop, open]);

  // Calculate dynamic max height for mobile drawer
  const getMobileMaxHeight = React.useMemo(() => {
    if (isDesktop || !viewportHeight) return maxHeight;
    
    // Reserve space for:
    // - Top safe area (status bar, notch, etc.) - env(safe-area-inset-top) or ~44px
    // - Swipe handle area - ~16px (mt-4 = 1rem) + handle height ~8px
    // - Header - ~50px (title + padding)
    // - Footer - ~70px (buttons + padding, compact when keyboard is open)
    const topSafeArea = 44; // Safe area for status bar/notch
    const swipeHandleArea = 24; // mt-4 (16px) + handle (8px)
    const headerHeight = 50;
    const footerHeight = 70; // Compact footer
    const reservedSpace = topSafeArea + swipeHandleArea + headerHeight + footerHeight;
    
    const availableHeight = viewportHeight - reservedSpace;
    
    // Use at least 40vh as minimum for very small viewports
    const minHeight = window.innerHeight * 0.4;
    const calculatedHeight = Math.max(availableHeight, minHeight);
    
    // Don't exceed 90vh
    const maxAllowedHeight = window.innerHeight * 0.9;
    return `${Math.min(calculatedHeight, maxAllowedHeight)}px`;
  }, [isDesktop, viewportHeight, maxHeight]);

  // Check if keyboard is likely open (viewport significantly smaller than window)
  const isKeyboardOpen = React.useMemo(() => {
    if (isDesktop || !viewportHeight) return false;
    return viewportHeight < window.innerHeight * 0.75;
  }, [isDesktop, viewportHeight]);

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
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
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
      <DrawerContent 
        ref={drawerContentRef}
        style={{ maxHeight: getMobileMaxHeight }} 
        className="flex flex-col"
      >
        <div className="mx-auto w-full max-w-sm flex flex-col flex-1 min-h-0">
          <DrawerHeader className="text-left pb-2 px-4 pt-2 flex-shrink-0">
            <DrawerTitle className="text-base">{title}</DrawerTitle>
          </DrawerHeader>
          {/* Scrollable content area */}
          <div className="overflow-y-auto px-4 pb-4 flex-1 min-h-0">
            {children}
          </div>
          {/* Footer outside scrollable area, but compact when keyboard is open */}
          {footer && (
            <DrawerFooter className={cn(
              "pt-2 pb-safe bg-background flex-shrink-0 border-t",
              isKeyboardOpen && "pt-2 pb-2"
            )}>
              {footer}
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

