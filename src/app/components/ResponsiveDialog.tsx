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

  // Calculate footer height for padding (approximate)
  const footerHeight = React.useMemo(() => {
    if (!footer || isDesktop) return 0;
    // Approximate footer height: padding + buttons + gap
    return 80; // ~80px for typical footer with 2 buttons
  }, [footer, isDesktop]);

  // Calculate dynamic max height for mobile drawer
  const getMobileMaxHeight = React.useMemo(() => {
    if (isDesktop || !viewportHeight) return maxHeight;
    
    // Reserve space for:
    // - Top margin (swipe handle area) - ~20px
    // - Swipe handle - ~8px (h-2)
    // - Header - ~50px (title + padding)
    // - Footer - always reserved, but footer is fixed at bottom of viewport
    const topMargin = 20;
    const swipeHandle = 8;
    const headerHeight = 50;
    
    // Footer is always visible but fixed at bottom, so we reserve space for it
    // but it won't "eat" into content when keyboard is open
    const reservedSpace = topMargin + swipeHandle + headerHeight + footerHeight;
    
    const availableHeight = viewportHeight - reservedSpace;
    
    // Use at least 200px as minimum for very small viewports
    const minHeight = 200;
    const calculatedHeight = Math.max(availableHeight, minHeight);
    
    // Don't exceed viewport height
    return `${Math.min(calculatedHeight, viewportHeight)}px`;
  }, [isDesktop, viewportHeight, maxHeight, footerHeight]);

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
        <div className="mx-auto w-full max-w-sm flex flex-col flex-1 min-h-0 relative">
          <DrawerHeader className="text-left pb-2 px-4 pt-2 flex-shrink-0">
            <DrawerTitle className="text-base">{title}</DrawerTitle>
          </DrawerHeader>
          {/* Scrollable content area with padding for footer */}
          <div 
            className="overflow-y-auto px-4 flex-1 min-h-0"
            style={{ 
              paddingBottom: footer ? `${footerHeight}px` : '1rem'
            }}
          >
            {children}
          </div>
        </div>
        {/* Floating footer - fixed at bottom of viewport, outside scrollable area */}
        {footer && (
          <DrawerFooter 
            className={cn(
              "fixed left-1/2 -translate-x-1/2 w-full max-w-sm pt-4 pb-safe bg-background border-t flex-shrink-0 z-[60]",
              "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
            )}
            style={{
              paddingBottom: `max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)`,
              bottom: 0,
            }}
          >
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}

