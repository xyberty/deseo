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
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);
  const [viewportHeight, setViewportHeight] = React.useState<number | null>(null);

  // Track visual viewport changes to detect keyboard
  React.useEffect(() => {
    if (isDesktop || typeof window === 'undefined') return;

    const updateViewport = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height;
        setViewportHeight(vh);
        // Keyboard is open if viewport is significantly smaller than window
        setIsKeyboardOpen(vh < window.innerHeight * 0.75);
      } else {
        setViewportHeight(window.innerHeight);
        setIsKeyboardOpen(false);
      }
    };

    updateViewport();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
    } else {
      window.addEventListener('resize', updateViewport);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
      } else {
        window.removeEventListener('resize', updateViewport);
      }
    };
  }, [isDesktop, open]);

  // When keyboard is open, use full viewport height to maximize content space
  // This allows drawer to show maximum content and scroll to reveal focused field
  const drawerStyle = React.useMemo(() => {
    if (isKeyboardOpen && viewportHeight) {
      // Use height (not maxHeight) to force drawer to take full viewport
      return { height: `${viewportHeight}px` };
    }
    return { maxHeight };
  }, [isKeyboardOpen, viewportHeight, maxHeight]);

  // Auto-scroll focused input into view when keyboard opens
  React.useEffect(() => {
    if (!isKeyboardOpen || isDesktop) return;

    // Small delay to ensure keyboard animation completes
    const timer = setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
        // Find scrollable container
        const scrollContainer = activeElement.closest('[class*="overflow-y-auto"]');
        if (scrollContainer) {
          const rect = activeElement.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const scrollTop = scrollContainer.scrollTop;
          
          // Calculate position relative to container
          const elementTop = rect.top - containerRect.top + scrollTop;
          const elementHeight = rect.height;
          const containerHeight = containerRect.height;
          
          // Scroll to center the element in container
          const targetScroll = elementTop - (containerHeight / 2) + (elementHeight / 2);
          scrollContainer.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        } else {
          // Fallback to standard scrollIntoView
          activeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isKeyboardOpen, isDesktop]);

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
        style={drawerStyle} 
        className="flex flex-col"
      >
        <div className="mx-auto w-full max-w-sm flex flex-col flex-1 min-h-0">
          <DrawerHeader className="text-left pb-2 px-4 pt-2 flex-shrink-0">
            <DrawerTitle className="text-base">{title}</DrawerTitle>
          </DrawerHeader>
          {/* Scrollable content area - takes full available space when keyboard is open */}
          <div className="overflow-y-auto px-4 pb-4 flex-1 min-h-0">
            {children}
          </div>
          {/* Footer is hidden when keyboard is open to maximize content space */}
          {footer && !isKeyboardOpen && (
            <DrawerFooter className="pt-4 pb-safe bg-background flex-shrink-0">
              {footer}
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

