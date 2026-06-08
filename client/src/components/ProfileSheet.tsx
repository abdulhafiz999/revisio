import React, { useEffect, useState } from 'react';
import { Loader2, GraduationCap, UserRound } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient, UserProfile } from '@/services/api.client';
import { useToast } from '@/hooks/use-toast';
import {
  CUSTOM_PROGRAM_VALUE,
  UNIVERSITY_PROGRAMS,
} from '@/data/universityPrograms';

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (profile: UserProfile) => void;
}

function resolveProgramSelection(savedProgram: string | null) {
  if (!savedProgram) {
    return { selected: '', custom: '' };
  }
  if (UNIVERSITY_PROGRAMS.includes(savedProgram as (typeof UNIVERSITY_PROGRAMS)[number])) {
    return { selected: savedProgram, custom: '' };
  }
  return { selected: CUSTOM_PROGRAM_VALUE, custom: savedProgram };
}

export function ProfileSheet({ open, onOpenChange, onSaved }: ProfileSheetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [customProgram, setCustomProgram] = useState('');

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      try {
        const profile = await apiClient.getProfile();
        setDisplayName(profile.display_name || '');
        const { selected, custom } = resolveProgramSelection(profile.program);
        setSelectedProgram(selected);
        setCustomProgram(custom);
      } catch (error: any) {
        toast({
          title: 'Could not load profile',
          description: error?.response?.data?.error || error?.message || 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, toast]);

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast({
        title: 'Name required',
        description: 'Please enter your name so Revi can address you properly.',
        variant: 'destructive',
      });
      return;
    }

    const program =
      selectedProgram === CUSTOM_PROGRAM_VALUE
        ? customProgram.trim()
        : selectedProgram.trim();

    if (!program) {
      toast({
        title: 'Program required',
        description: 'Select your university program so Revi can tutor you in your field.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const profile = await apiClient.updateProfile({
        display_name: trimmedName,
        program,
      });
      onSaved?.(profile);
      toast({
        title: 'Profile saved',
        description: `Revi is now your ${program} study tutor.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Could not save profile',
        description: error?.response?.data?.error || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Your profile</SheetTitle>
          <SheetDescription>
            Tell Revi your name and university program — Computer Science, Medicine, Law,
            Physics, History, and more — so it acts like a personal tutor in your field.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                Your name
              </Label>
              <Input
                id="profile-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-program" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                University program
              </Label>
              <Select
                value={selectedProgram || 'none'}
                onValueChange={(value) => setSelectedProgram(value === 'none' ? '' : value)}
              >
                <SelectTrigger id="profile-program">
                  <SelectValue placeholder="Select your program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a program</SelectItem>
                  {UNIVERSITY_PROGRAMS.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProgram === CUSTOM_PROGRAM_VALUE && (
                <Input
                  value={customProgram}
                  onChange={(e) => setCustomProgram(e.target.value)}
                  placeholder="Enter your program (e.g. Astrophysics)"
                  maxLength={100}
                />
              )}

              <p className="text-xs text-muted-foreground">
                Revi adapts to your field — a med student gets clinical framing, a CS student
                gets programming examples, a law student gets legal reasoning, and so on.
              </p>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save profile'
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ProfileSheet;
