"use client";

import { useRef, useEffect } from 'react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface MagicLinkFormProps {
  email: string;
  setEmail: (value: string) => void;
  isLoading: boolean;
  isMobile?: boolean;
  autoFocus?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function MagicLinkForm({
  email,
  setEmail,
  isLoading,
  isMobile = false,
  autoFocus = false,
  onSubmit,
}: MagicLinkFormProps) {
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && emailInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const emailId = isMobile ? 'magic-link-email-mobile' : 'magic-link-email';

  return (
    <form id="magic-link-form" onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          ref={emailInputRef}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={isLoading}
          required
        />
      </div>
    </form>
  );
} 