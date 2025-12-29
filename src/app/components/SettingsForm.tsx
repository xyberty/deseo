"use client";

import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from '@/app/components/ui/field';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';
import { ChevronsUpDown, Pencil } from 'lucide-react';
import { CURRENCIES } from '@/app/lib/currencies';
import { toast } from 'sonner';

interface SettingsFormProps {
  wishlistTitle: string;
  setWishlistTitle: (value: string) => void;
  wishlistDescription: string;
  setWishlistDescription: (value: string) => void;
  listCurrency: string;
  setListCurrency: (value: string) => void;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
  allowEdits: boolean;
  setAllowEdits: (value: boolean) => void;
  isArchived: boolean;
  shareUrl: string;
  shortUrl: string;
  shortCode: string;
  customCode: string;
  setCustomCode: (value: string) => void;
  isCustomCodeEditing: boolean;
  setIsCustomCodeEditing: (value: boolean) => void;
  updateCustomCode: () => void;
  copyShareLink: () => void;
  analytics: {
    totalClicks: number;
    clicksByDate: Array<{ date: string; count: number }>;
    recentClicks: Array<{ clickedAt: Date; referer?: string; userAgent?: string }>;
  } | null;
  userPermissions: {
    canEdit: boolean;
    isOwner: boolean;
  };
  isMobile?: boolean;
  onDeleteClick?: () => void;
}

export function SettingsForm({
  wishlistTitle,
  setWishlistTitle,
  wishlistDescription,
  setWishlistDescription,
  listCurrency,
  setListCurrency,
  isPublic,
  setIsPublic,
  allowEdits,
  setAllowEdits,
  isArchived,
  shareUrl,
  shortUrl,
  shortCode,
  customCode,
  setCustomCode,
  isCustomCodeEditing,
  setIsCustomCodeEditing,
  updateCustomCode,
  copyShareLink,
  analytics,
  userPermissions,
  isMobile = false,
  onDeleteClick,
}: SettingsFormProps) {
  const titleId = isMobile ? 'wishlist-title-mobile' : 'wishlist-title';
  const descriptionId = isMobile ? 'wishlist-description-mobile' : 'wishlist-description';
  const currencyId = isMobile ? 'currency-select-mobile' : 'currency-select';
  const shortLinkId = isMobile ? 'short-link-mobile' : 'short-link';
  const customCodeId = isMobile ? 'custom-code-mobile' : 'custom-code';
  const publicToggleId = isMobile ? 'public-toggle-mobile' : 'public-toggle';
  const editsToggleId = isMobile ? 'edits-toggle-mobile' : 'edits-toggle';

  return (
    <FieldGroup className="py-4 pb-8 gap-4">
      {/* Details Section */}
      <FieldSet>
        <FieldLegend variant={isMobile ? "label" : undefined}>Details</FieldLegend>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor={titleId}>Title</FieldLabel>
            <Input
              id={titleId}
              value={wishlistTitle}
              onChange={(e) => setWishlistTitle(e.target.value)}
              placeholder="Enter wishlist title"
              disabled={isArchived}
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={descriptionId}>Description</FieldLabel>
            <Textarea
              id={descriptionId}
              value={wishlistDescription}
              onChange={(e) => setWishlistDescription(e.target.value)}
              placeholder="Add a description for your wishlist"
              rows={3}
              disabled={isArchived}
            />
            <FieldDescription>(optional)</FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      {/* Currency Section */}
      <FieldSet>
        <FieldLegend variant={isMobile ? "label" : undefined}>Currency</FieldLegend>
        <FieldGroup>
          <Field orientation={isMobile ? undefined : "responsive"}>
            {!isMobile && (
              <FieldContent>
                <FieldLabel htmlFor={currencyId}>Default Currency</FieldLabel>
                <FieldDescription>Items will use this currency by default</FieldDescription>
              </FieldContent>
            )}
            {isMobile && (
              <>
                <FieldLabel htmlFor={currencyId}>Default Currency</FieldLabel>
                <FieldDescription>Items will use this currency by default</FieldDescription>
              </>
            )}
            <Select value={listCurrency} onValueChange={setListCurrency} disabled={isArchived}>
              <SelectTrigger id={currencyId}>
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
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      {/* Sharing Section */}
      <FieldSet>
        <FieldLegend variant={isMobile ? "label" : undefined}>Sharing</FieldLegend>
        <FieldGroup className="gap-2">
          <Field>
            <FieldLabel htmlFor={shortLinkId}>Short Link</FieldLabel>
            <div className="flex gap-2">
              <Input 
                id={shortLinkId}
                value={shortUrl || 'Generating...'} 
                readOnly 
                onClick={(e) => e.currentTarget.select()}
                disabled={isArchived}
                className={`font-mono ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'}`}
              />
              <Button variant="outline" onClick={copyShareLink} disabled={isArchived || !shortUrl}>
                Copy
              </Button>
            </div>
          </Field>
          
          {/* Custom Code Editor */}
          {userPermissions.isOwner && !isArchived && (
            <Field>
              {!isCustomCodeEditing ? (
                <div className="flex items-center gap-1">
                  <FieldDescription>
                    Custom Code: <span className="font-mono font-semibold">{shortCode || 'auto-generated'}</span>
                  </FieldDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomCode(shortCode || '');
                      setIsCustomCodeEditing(true);
                    }}
                    className="h-7"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <FieldLabel htmlFor={customCodeId}>Custom Code</FieldLabel>
                  <Input
                    id={customCodeId}
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="Enter custom code (3-20 chars)"
                    className={`font-mono ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'}`}
                    maxLength={20}
                    autoComplete="off"
                  />
                  <FieldDescription>Alphanumeric only, 3-20 characters</FieldDescription>
                  <div className={`flex gap-2 ${isMobile ? '' : ''}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={updateCustomCode}
                      disabled={!customCode.trim() || customCode.trim().length < 3}
                      className={isMobile ? 'flex-1' : ''}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCustomCodeEditing(false);
                        setCustomCode(shortCode || '');
                      }}
                      className={isMobile ? 'flex-1' : ''}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </Field>
          )}
          
          {/* Full Link (Collapsible) */}
          <Field>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between text-sm">
                  <span>Show full link</span>
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    onClick={(e) => e.currentTarget.select()}
                    disabled={isArchived}
                    className="font-mono text-xs break-all"
                  />
                  <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Full link copied');
                  }} disabled={isArchived}>
                    Copy
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Field>

          {/* Analytics Section */}
          {analytics && userPermissions.isOwner && (
            <Field className="pt-2">
              <FieldLabel>Link Analytics</FieldLabel>
              <div className="flex gap-2">
                <div>
                  <p className="text-sm"><span className="text-muted-foreground">Total clicks:</span> {analytics.totalClicks}</p>
                </div>
                <div>
                  <p className="text-sm"><span className="text-muted-foreground">Today:</span> {analytics.clicksByDate.length > 0 
                      ? analytics.clicksByDate[analytics.clicksByDate.length - 1].count 
                      : 0}
                  </p>
                </div>
              </div>
              {analytics.recentClicks.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" className="w-full justify-between text-sm mt-2">
                      <span>Recent clicks ({analytics.recentClicks.length})</span>
                      <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {analytics.recentClicks.map((click, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground py-1 border-b">
                          {new Date(click.clickedAt).toLocaleString()}
                          {click.referer && (
                            <span className="ml-2 text-muted-foreground/70">from {new URL(click.referer).hostname}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </Field>
          )}
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      {/* Privacy Section */}
      <FieldSet>
        <FieldLegend variant={isMobile ? "label" : undefined}>Privacy</FieldLegend>
        <FieldGroup className="gap-4">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor={publicToggleId}>Public Wishlist</FieldLabel>
              <FieldDescription>Anyone can view using just the wishlist ID.</FieldDescription>
            </FieldContent>
            <Switch
              id={publicToggleId}
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isArchived}
            />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor={editsToggleId}>Allow Edits</FieldLabel>
              <FieldDescription>Anyone with access can add or edit items</FieldDescription>
            </FieldContent>
            <Switch
              id={editsToggleId}
              checked={allowEdits}
              onCheckedChange={setAllowEdits}
              disabled={isArchived}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      {/* Danger Zone */}
      <FieldSet>
        <FieldLegend variant={isMobile ? "label" : undefined} className="text-destructive">Danger Zone</FieldLegend>
        <FieldGroup>
          <Field orientation="responsive">
            <FieldDescription>Once you delete a wishlist, there is no going back. Please be certain.</FieldDescription>
            <Button 
              variant="destructive" 
              onClick={onDeleteClick}
            >
              Delete Wishlist
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  );
}

