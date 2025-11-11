'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Vote, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Validation schema
const electionSchema = z.object({
  role_name: z.string().min(1, 'Role name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  candidates: z.array(
    z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Aptos address format')
  ).min(2, 'At least 2 candidates required'),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

type ElectionFormData = z.infer<typeof electionSchema>;

interface ElectionFormProps {
  onSuccess?: () => void;
  isAdmin?: boolean;
  adminAddress?: string;
}

export function ElectionForm({ onSuccess, isAdmin = false, adminAddress }: ElectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCandidate, setNewCandidate] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ElectionFormData>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      role_name: '',
      description: '',
      start_date: '',
      end_date: '',
      candidates: [],
    },
  });

  const candidates = watch('candidates') || [];

  const addCandidate = () => {
    if (!newCandidate) return;

    // Validate address format
    const addressRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!addressRegex.test(newCandidate)) {
      toast.error('Invalid Aptos address format');
      return;
    }

    // Check for duplicates
    if (candidates.includes(newCandidate)) {
      toast.error('Candidate already added');
      return;
    }

    setValue('candidates', [...candidates, newCandidate]);
    setNewCandidate('');
    toast.success('Candidate added');
  };

  const removeCandidate = (index: number) => {
    const updated = candidates.filter((_, i) => i !== index);
    setValue('candidates', updated);
    toast.success('Candidate removed');
  };

  const onSubmit = async (data: ElectionFormData) => {
    if (!isAdmin) {
      toast.error('Only admin can create elections');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert dates to Unix timestamps
      const startTimestamp = Math.floor(new Date(data.start_date).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(data.end_date).getTime() / 1000);

      // TODO: Integrate with Aptos wallet and submit transaction
      // const payload = {
      //   type: 'entry_function_payload',
      //   function: 'nyu_aptos_builder_camp::governance::create_election',
      //   type_arguments: [],
      //   arguments: [
      //     Array.from(new TextEncoder().encode(data.role_name)),
      //     startTimestamp,
      //     endTimestamp,
      //     data.candidates,
      //   ],
      // };

      // Simulate transaction submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Election created successfully!');
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create election:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create election');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAdmin === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Create Election
          </CardTitle>
          <CardDescription>Checking admin privileges...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Create Election
          </CardTitle>
          <CardDescription>Admin privileges required</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Only the admin can create elections. Current admin: {adminAddress || 'Unknown'}
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
          <Vote className="h-5 w-5" />
          Create Election
        </CardTitle>
        <CardDescription>
          Create a new election for e-board role selection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Role Name */}
          <div className="space-y-2">
            <Label htmlFor="role_name">Role Name</Label>
            <Input
              id="role_name"
              placeholder="e.g., President, Vice President"
              {...register('role_name')}
            />
            {errors.role_name && (
              <p className="text-sm text-destructive">{errors.role_name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the role and responsibilities..."
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date & Time</Label>
            <Input
              id="start_date"
              type="datetime-local"
              {...register('start_date')}
            />
            {errors.start_date && (
              <p className="text-sm text-destructive">{errors.start_date.message}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date & Time</Label>
            <Input
              id="end_date"
              type="datetime-local"
              {...register('end_date')}
            />
            {errors.end_date && (
              <p className="text-sm text-destructive">{errors.end_date.message}</p>
            )}
          </div>

          {/* Candidates */}
          <div className="space-y-2">
            <Label>Candidates</Label>
            <div className="flex gap-2">
              <Input
                placeholder="0x... (Aptos address)"
                value={newCandidate}
                onChange={(e) => setNewCandidate(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCandidate())}
              />
              <Button type="button" onClick={addCandidate} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.candidates && (
              <p className="text-sm text-destructive">{errors.candidates.message}</p>
            )}

            {candidates.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} added
                </p>
                <div className="space-y-2">
                  {candidates.map((candidate, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <code className="text-xs">{candidate}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCandidate(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Election...' : 'Create Election'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
