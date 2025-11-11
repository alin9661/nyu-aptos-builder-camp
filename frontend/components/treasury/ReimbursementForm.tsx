'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { submitReimbursement } from '@/lib/api/treasury';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

// Form validation schema
const reimbursementSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  payee: z.string().min(1, 'Payee address is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['travel', 'supplies', 'software', 'marketing', 'other'], {
    required_error: 'Category is required',
  }),
});

type ReimbursementFormData = z.infer<typeof reimbursementSchema>;

interface ReimbursementFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReimbursementForm({ onSuccess, onCancel }: ReimbursementFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ReimbursementFormData>({
    resolver: zodResolver(reimbursementSchema),
  });

  const category = watch('category');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const onSubmit = async (data: ReimbursementFormData) => {
    try {
      setSubmitting(true);

      // Validate receipt upload
      if (!file) {
        toast.error('Please upload a receipt');
        return;
      }

      // TODO: In a real implementation, this would:
      // 1. Upload the file to IPFS or cloud storage
      // 2. Create a blockchain transaction with the reimbursement data
      // 3. Submit the transaction hash to the backend

      // Simulated transaction hash for demonstration
      const mockTransactionHash = '0x' + Math.random().toString(16).substring(2, 66);

      // Submit to backend
      const response = await submitReimbursement(mockTransactionHash);

      if (response.success) {
        toast.success('Reimbursement request submitted successfully!');
        onSuccess?.();
      } else {
        toast.error(response.error || 'Failed to submit reimbursement request');
      }
    } catch (error) {
      console.error('Reimbursement submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Reimbursement Request</CardTitle>
        <CardDescription>
          Fill out the form below to request a reimbursement from the treasury
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (APT) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="text"
              placeholder="0.00"
              {...register('amount')}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Payee Field */}
          <div className="space-y-2">
            <Label htmlFor="payee">
              Payee Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="payee"
              type="text"
              placeholder="0x..."
              {...register('payee')}
              aria-invalid={!!errors.payee}
            />
            {errors.payee && (
              <p className="text-sm text-destructive">{errors.payee.message}</p>
            )}
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(value) =>
                setValue('category', value as ReimbursementFormData['category'])
              }
            >
              <SelectTrigger id="category" aria-invalid={!!errors.category}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="supplies">Supplies</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide details about this reimbursement request..."
              {...register('description')}
              aria-invalid={!!errors.description}
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt">
              Receipt <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-4">
              {!file ? (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="receipt"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG or PDF (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      id="receipt"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    disabled={uploading || submitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting || uploading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
