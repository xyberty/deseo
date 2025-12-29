"use client";

import { Input } from '@/app/components/ui/input';
import { Switch } from '@/app/components/ui/switch';
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldSeparator } from '@/app/components/ui/field';

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
    <form id="reserve-item-form" onSubmit={onSubmit}>
      <FieldGroup className="py-2 gap-4">
        <FieldDescription>All fields below are optional.</FieldDescription>
        <Field>
          <FieldLabel htmlFor={emailId}>Email</FieldLabel>
          <Input
            id={emailId}
            type="email"
            autoComplete="off"
            value={reserverEmail}
            onChange={(e) => setReserverEmail(e.target.value)}
            placeholder="Enter your email"
            autoFocus={autoFocus}
          />
          <FieldDescription>
            {allowDisclosure && !reserverEmail && !displayName ? 
              "Please provide either an email or display name if you want to be identified." : 
              "Your email will only be visible to the wishlist creator if you allow disclosure."}
          </FieldDescription>
        </Field>
        
        <Field>
          <FieldLabel htmlFor={displayNameId}>Display Name</FieldLabel>
          <Input
            id={displayNameId}
            type="text"
            autoComplete="off"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
          />
          <FieldDescription>How you would like to be identified.</FieldDescription>
        </Field>
        
        <Field>
          <FieldLabel htmlFor={passphraseId}>Passphrase</FieldLabel>
          <Input
            id={passphraseId}
            type="text"
            autoComplete="off"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="A secret word to identify your reservation"
          />
        </Field>

        <FieldSeparator />
        
        <Field orientation="horizontal">
          <FieldLabel htmlFor={disclosureId}>
            Allow the creator to see my identity
          </FieldLabel>
          <Switch
            id={disclosureId}
            checked={allowDisclosure}
            onCheckedChange={setAllowDisclosure}
          />
        </Field>
      </FieldGroup>
    </form>
  );
}

