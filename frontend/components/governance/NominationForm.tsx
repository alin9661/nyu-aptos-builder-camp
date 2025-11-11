'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Validation schema
const nominationSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(500, 'Bio must not exceed 500 characters'),
  statement: z.string().min(100, 'Statement must be at least 100 characters').max(1000, 'Statement must not exceed 1000 characters'),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type NominationFormData = z.infer<typeof nominationSchema>;

interface NominationFormProps {
  electionId: number;
  roleName: string;
  userAddress: string;
  isEligible?: boolean;
  alreadyNominated?: boolean;
  onSuccess?: () => void;
}

export function NominationForm({
  electionId,
  roleName,
  userAddress,
  isEligible = true,
  alreadyNominated = false,
  onSuccess,
}: NominationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<NominationFormData>({
    resolver: zodResolver(nominationSchema),
    defaultValues: {
      display_name: '',
      bio: '',
      statement: '',
      contact_email: '',
    },
  });

  const bio = watch('bio') || '';
  const statement = watch('statement') || '';

  const onSubmit = async (data: NominationFormData) => {
    if (!isEligible) {
      toast.error('You are not eligible to nominate for this election');
      return;
    }

    if (alreadyNominated) {
      toast.error('You have already nominated for this election');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Integrate with Aptos wallet and submit transaction
      // const payload = {
      //   type: 'entry_function_payload',
      //   function: 'nyu_aptos_builder_camp::governance::pitch',
      //   type_arguments: [],
      //   arguments: [
      //     Array.from(new TextEncoder().encode(roleName)),
      //     electionId,
      //   ],
      // };

      // Simulate transaction submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Nomination submitted successfully!');
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit nomination:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit nomination');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEligible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nominate for {roleName}
          </CardTitle>
          <CardDescription>Submit your candidacy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              You are not eligible to nominate for this position. Only e-board members can run for elections.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alreadyNominated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nominate for {roleName}
          </CardTitle>
          <CardDescription>Submit your candidacy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-600">
              You have already submitted your nomination for this election.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Nominate for {roleName}
        </CardTitle>
        <CardDescription>
          Election ID: {electionId} • Your Address: {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              placeholder="Your full name"
              {...register('display_name')}
            />
            {errors.display_name && (
              <p className="text-sm text-destructive">{errors.display_name.message}</p>
            )}
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email (Optional)</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="your.email@example.com"
              {...register('contact_email')}
            />
            {errors.contact_email && (
              <p className="text-sm text-destructive">{errors.contact_email.message}</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="bio">Bio</Label>
              <span className="text-xs text-muted-foreground">
                {bio.length}/500 characters
              </span>
            </div>
            <textarea
              id="bio"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell voters about yourself, your experience, and background..."
              maxLength={500}
              {...register('bio')}
            />
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>

          {/* Statement */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="statement">Campaign Statement</Label>
              <span className="text-xs text-muted-foreground">
                {statement.length}/1000 characters
              </span>
            </div>
            <textarea
              id="statement"
              className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Why are you running for this position? What are your goals and vision?"
              maxLength={1000}
              {...register('statement')}
            />
            {errors.statement && (
              <p className="text-sm text-destructive">{errors.statement.message}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-600">
              <strong>Note:</strong> By submitting this nomination, you will be registered as a candidate.
              Candidates cannot vote in their own election.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting Nomination...' : 'Submit Nomination'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
