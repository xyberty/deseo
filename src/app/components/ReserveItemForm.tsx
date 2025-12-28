"use client";

import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';

interface ReserveItemFormProps {
  reserverEmail: string;
  setReserverEmail: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  passphrase: string;
  setPassphrase: (value: string) => void;
  allowDisclosure: boolean;
  setAllowDisclosure: (value: boolean) => void;
  isMobile?: boolean;
  autoFocus?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ReserveItemForm({
  reserverEmail,
  setReserverEmail,
  displayName,
  setDisplayName,
  passphrase,
  setPassphrase,
  allowDisclosure,
  setAllowDisclosure,
  isMobile = false,
  autoFocus = false,
  onSubmit,
}: ReserveItemFormProps) {
  const emailId = isMobile ? 'reserver-email-mobile' : 'reserver-email';
  const displayNameId = isMobile ? 'display-name-mobile' : 'display-name';
  const passphraseId = isMobile ? 'passphrase-mobile' : 'passphrase';
  const disclosureId = isMobile ? 'allow-disclosure-mobile' : 'allow-disclosure';

  return (
    <form id="reserve-item-form" onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor={emailId}>Your Email (optional)</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="off"
          value={reserverEmail}
          onChange={(e) => setReserverEmail(e.target.value)}
          placeholder="Enter your email to receive updates"
          autoFocus={autoFocus}
        />
        <p className="text-xs text-gray-500">
          {allowDisclosure && !reserverEmail && !displayName ? 
            "Please provide either an email or display name if you want to be identified" : 
            "Your email will only be visible to the wishlist creator if you allow disclosure"}
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={displayNameId}>Display Name (optional)</Label>
        <Input
          id={displayNameId}
          type="text"
          autoComplete="off"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How you'd like to be identified"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={passphraseId}>Passphrase (optional)</Label>
        <Input
          id={passphraseId}
          type="text"
          autoComplete="off"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="A secret word to identify your reservation"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={disclosureId} className="text-sm font-medium">
            Allow the creator to see my identity
          </Label>
        </div>
        <Switch
          id={disclosureId}
          checked={allowDisclosure}
          onCheckedChange={setAllowDisclosure}
        />
      </div>
    </form>
  );
}

