# Treasury Management UI Implementation

## Overview
This document provides a comprehensive guide to the Treasury Management UI components implemented for the Nexus application. The implementation includes a complete reimbursement workflow with form submission, approval management, receipt handling, and transaction confirmations.

## Files Created

### UI Components (shadcn/ui)
1. **`/frontend/components/ui/dialog.tsx`**
   - Modal dialog component using Radix UI
   - Supports overlay, content, header, footer, title, and description
   - Includes close button and animations

2. **`/frontend/components/ui/textarea.tsx`**
   - Multi-line text input component
   - Consistent styling with other form inputs
   - Supports validation states

3. **`/frontend/components/ui/progress.tsx`**
   - Progress bar component using Radix UI
   - Animated transitions
   - Customizable value display

4. **`/frontend/components/ui/toast.tsx`**
   - Toast notification system using Sonner
   - Success, error, and info states
   - Auto-dismiss functionality

### Treasury Components

5. **`/frontend/components/treasury/ReimbursementForm.tsx`**
   - Complete form for submitting reimbursement requests
   - Features:
     - Amount input with validation
     - Payee address field
     - Category selection (travel, supplies, software, marketing, other)
     - Description textarea (min 10 characters)
     - File upload for receipts (JPG, PNG, PDF, max 10MB)
     - Form validation using react-hook-form and zod
     - Success/error feedback with toast notifications
     - Loading states during submission

6. **`/frontend/components/treasury/ApprovalWorkflow.tsx`**
   - Multi-step approval progress visualization
   - Features:
     - Progress indicator showing current approvals vs required
     - Status badges (Pending, Approved, Paid Out)
     - Reimbursement details display
     - Approval history table with transaction links
     - Approve/Reject buttons (for authorized users)
     - Optimistic UI updates
     - Integration with TransactionModal

7. **`/frontend/components/treasury/TransactionModal.tsx`**
   - Transaction confirmation and status modal
   - Features:
     - Transaction details display (action, amount, recipient)
     - Gas fee estimate
     - Confirm/Cancel buttons
     - Loading states (idle, confirming, processing, success, error)
     - Success confirmation with auto-close
     - Error handling with retry option
     - Warning messages for destructive actions

8. **`/frontend/components/treasury/ReceiptViewer.tsx`**
   - Receipt preview and download component
   - Features:
     - Image preview (JPG, PNG)
     - PDF preview with iframe
     - Download functionality with progress indicator
     - File metadata display (name, size, type, IPFS hash)
     - Open in new tab option
     - Loading states and error handling
     - IPFS gateway integration

### Pages

9. **`/frontend/app/treasury/page.tsx`**
   - Main Treasury Management dashboard
   - Features:
     - Overview tab with statistics and recent activity
     - Pending tab showing requests awaiting approval
     - History tab with approved/rejected requests
     - Submit request tab with ReimbursementForm
     - Treasury balance display
     - Statistics cards (total requests, pending, approved, total paid)
     - Role-based UI (member, treasurer, admin)
     - Real-time data updates
     - Responsive layout with sidebar

## Dependencies

All required dependencies are already installed in the project:

```json
{
  "@hookform/resolvers": "^3.10.0",
  "@radix-ui/react-dialog": "1.1.4",
  "@radix-ui/react-progress": "1.1.1",
  "@radix-ui/react-toast": "1.2.4",
  "react-hook-form": "^7.60.0",
  "sonner": "latest",
  "zod": "3.25.76",
  "lucide-react": "^0.454.0"
}
```

No additional packages need to be installed.

## Component Usage Guide

### 1. ReimbursementForm

```tsx
import { ReimbursementForm } from '@/components/treasury/ReimbursementForm';

function MyComponent() {
  return (
    <ReimbursementForm
      onSuccess={() => console.log('Request submitted!')}
      onCancel={() => console.log('Form cancelled')}
    />
  );
}
```

**Props:**
- `onSuccess?: () => void` - Callback when form is successfully submitted
- `onCancel?: () => void` - Callback when form is cancelled

**Validation Rules:**
- Amount: Required, must be positive number
- Payee: Required, must be valid address
- Category: Required, must be one of: travel, supplies, software, marketing, other
- Description: Required, minimum 10 characters
- Receipt: Required, max 10MB, types: JPG, PNG, PDF

### 2. ApprovalWorkflow

```tsx
import { ApprovalWorkflow } from '@/components/treasury/ApprovalWorkflow';

function MyComponent() {
  const handleApprove = async (id: number) => {
    // Submit blockchain transaction
    // Call API to record approval
  };

  return (
    <ApprovalWorkflow
      reimbursement={reimbursementData}
      requiredApprovals={3}
      isApprover={true}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
```

**Props:**
- `reimbursement: ReimbursementDetails` - The reimbursement request data
- `requiredApprovals?: number` - Number of approvals needed (default: 3)
- `isApprover?: boolean` - Whether current user can approve (default: false)
- `onApprove?: (id: number) => Promise<void>` - Approval handler
- `onReject?: (id: number) => Promise<void>` - Rejection handler

### 3. TransactionModal

```tsx
import { TransactionModal } from '@/components/treasury/TransactionModal';

function MyComponent() {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    // Execute blockchain transaction
    await submitTransaction();
  };

  return (
    <TransactionModal
      open={open}
      onOpenChange={setOpen}
      title="Approve Reimbursement"
      description="Confirm that you want to approve this request"
      action="approve"
      amount="100 APT"
      recipient="0x123..."
      onConfirm={handleConfirm}
      variant="default"
    />
  );
}
```

**Props:**
- `open: boolean` - Modal visibility state
- `onOpenChange: (open: boolean) => void` - Callback to control visibility
- `title: string` - Modal title
- `description: string` - Modal description
- `action: 'approve' | 'reject' | 'submit' | 'payout'` - Transaction action type
- `amount?: string` - Transaction amount to display
- `recipient?: string` - Recipient address to display
- `onConfirm: () => Promise<void>` - Confirmation handler
- `variant?: 'default' | 'destructive'` - Visual style variant

**States:**
- `idle` - Initial state, showing transaction details
- `confirming` - User clicked confirm, preparing transaction
- `processing` - Transaction in progress
- `success` - Transaction completed successfully
- `error` - Transaction failed

### 4. ReceiptViewer

```tsx
import { ReceiptViewer } from '@/components/treasury/ReceiptViewer';

function MyComponent() {
  return (
    <ReceiptViewer
      ipfsHash="QmXxx..."
      fileName="receipt.pdf"
      fileSize={125000}
      mimeType="application/pdf"
      showMetadata={true}
    />
  );
}
```

**Props:**
- `ipfsHash?: string` - IPFS hash of the receipt file
- `fileName?: string` - Original filename
- `fileSize?: number` - File size in bytes
- `mimeType?: string` - MIME type (image/jpeg, image/png, application/pdf)
- `showMetadata?: boolean` - Show file information section (default: true)

**Supported File Types:**
- Images: JPG, PNG (shown with `<img>` preview)
- PDF: Displayed in iframe
- Other: Shows icon with download option

### 5. Treasury Dashboard Page

Access the dashboard at `/treasury` in your application.

**Features:**
- **Overview Tab**: Treasury balance, statistics, recent activity
- **Pending Tab**: Requests awaiting approval (with ApprovalWorkflow)
- **History Tab**: Completed/approved requests
- **Submit Tab**: New reimbursement request form

**Role-Based Access:**
- `member`: Can view dashboard and submit requests
- `treasurer`: Can approve/reject requests + member permissions
- `admin`: Full access to all features

## Integration with Blockchain

The components are designed to integrate with Aptos blockchain transactions. Here's the workflow:

### Submitting a Reimbursement

1. User fills out ReimbursementForm
2. File is uploaded to IPFS (or cloud storage)
3. Blockchain transaction is created with:
   - Amount
   - Payee address
   - Description
   - IPFS hash
4. User signs transaction in wallet
5. Transaction hash is sent to backend API via `submitReimbursement(txHash)`
6. Backend indexes the transaction

### Approving a Reimbursement

1. Approver clicks "Approve" in ApprovalWorkflow
2. TransactionModal opens showing details
3. User confirms
4. Blockchain transaction is created
5. User signs transaction
6. Transaction hash sent to backend via `approveReimbursement(id, txHash)`
7. Backend updates approval count
8. UI updates optimistically

## API Integration

The components use these API functions from `/lib/api/treasury.ts`:

```typescript
// Submit new reimbursement
await submitReimbursement(transactionHash: string)

// Record approval
await approveReimbursement(id: number, transactionHash: string)

// Fetch reimbursements
const { data } = useReimbursements({ page: 1, limit: 20 })

// Fetch specific request
const { data } = useReimbursementDetails(id: number)

// Fetch treasury stats
const { data } = useTreasuryStats()
```

## Styling and Theming

All components use shadcn/ui design system with:
- Tailwind CSS for styling
- CSS variables for theming
- Dark mode support (via next-themes)
- Responsive design (mobile-first)
- Consistent spacing and typography

## Form Validation

ReimbursementForm uses Zod schema validation:

```typescript
const reimbursementSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  payee: z.string().min(1, 'Payee address is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['travel', 'supplies', 'software', 'marketing', 'other']),
});
```

## Error Handling

All components implement comprehensive error handling:
- Form validation errors shown inline
- API errors displayed with toast notifications
- Transaction errors shown in TransactionModal
- Loading states for async operations
- Retry mechanisms for failed operations

## Accessibility

Components follow WCAG 2.1 guidelines:
- Keyboard navigation support
- ARIA labels and descriptions
- Focus management in modals
- Screen reader friendly
- Proper semantic HTML

## Testing Recommendations

### Unit Tests
- Test form validation logic
- Test component rendering states
- Mock API calls

### Integration Tests
- Test complete reimbursement submission flow
- Test approval workflow with multiple approvers
- Test file upload and preview

### E2E Tests
- Test full user journey from submission to approval
- Test role-based access control
- Test error scenarios

## Future Enhancements

Potential improvements:
1. **Real-time Updates**: WebSocket integration for live approval updates
2. **Advanced Filtering**: Search and filter reimbursements by date, amount, status
3. **Bulk Actions**: Approve/reject multiple requests at once
4. **Analytics Dashboard**: Charts showing spending trends and patterns
5. **Notification System**: Email/push notifications for pending approvals
6. **Comment System**: Add comments/notes to reimbursement requests
7. **Audit Trail**: Complete history of all actions taken on a request
8. **Budget Management**: Set spending limits per category
9. **Multi-signature Approvals**: Configure approval rules (e.g., 2 of 3)
10. **Recurring Reimbursements**: Support for regular scheduled payments

## Support

For issues or questions:
1. Check component prop types and usage examples above
2. Review the implementation code in respective files
3. Verify API endpoints are correctly configured
4. Check browser console for detailed error messages

## License

This implementation is part of the NYUxAptos Nexus project.
