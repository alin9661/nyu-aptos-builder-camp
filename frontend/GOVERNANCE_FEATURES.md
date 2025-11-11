# Governance Features Implementation

This document describes the comprehensive governance features UI implementation for the Nexus application.

## Files Created

### Components (`/frontend/components/governance/`)

1. **ElectionForm.tsx** - Election creation form (admin only)
2. **NominationForm.tsx** - Candidate self-nomination interface
3. **VotingCard.tsx** - Interactive voting interface for elections
4. **ElectionResults.tsx** - Real-time results visualization
5. **ProposalCard.tsx** - Proposal voting interface

### Pages (`/frontend/app/governance/`)

6. **page.tsx** - Main governance dashboard page

### Utilities (`/frontend/lib/`)

7. **governance-utils.ts** - Helper functions for governance operations

## Component Overview

### 1. ElectionForm (`ElectionForm.tsx`)

**Purpose**: Create new elections (admin only)

**Features**:
- Admin role verification
- Form validation with Zod
- Dynamic candidate list management
- Date/time pickers for election period
- Blockchain transaction integration (TODO)

**Props**:
```typescript
interface ElectionFormProps {
  onSuccess?: () => void;
  isAdmin?: boolean;
  adminAddress?: string;
}
```

**Usage**:
```tsx
<ElectionForm
  isAdmin={true}
  adminAddress="0x..."
  onSuccess={() => refetchElections()}
/>
```

### 2. NominationForm (`NominationForm.tsx`)

**Purpose**: Allow e-board members to nominate themselves for elections

**Features**:
- Eligibility check (e-board members only)
- Candidate profile fields (name, bio, statement)
- Character count validation
- Already nominated detection
- Email field (optional)

**Props**:
```typescript
interface NominationFormProps {
  electionId: number;
  roleName: string;
  userAddress: string;
  isEligible?: boolean;
  alreadyNominated?: boolean;
  onSuccess?: () => void;
}
```

### 3. VotingCard (`VotingCard.tsx`)

**Purpose**: Display candidates and allow users to vote

**Features**:
- Candidate display with avatars
- Real-time vote counts and percentages
- Vote weight indicator
- Already voted state handling
- Leading candidate highlighting
- Progress bars for vote distribution

**Props**:
```typescript
interface VotingCardProps {
  electionId: number;
  roleName: string;
  candidates: Candidate[];
  tallies: VoteTally[];
  userAddress: string;
  hasVoted?: boolean;
  votingWeight?: number;
  isActive?: boolean;
  onVoteSuccess?: () => void;
}
```

### 4. ElectionResults (`ElectionResults.tsx`)

**Purpose**: Display election results with winner announcement

**Features**:
- Winner announcement with trophy badge
- Vote distribution visualization
- Ranking badges (1st, 2nd, 3rd)
- Election statistics overview
- Vote history display
- Responsive design

**Props**:
```typescript
interface ElectionResultsProps {
  electionId: number;
  roleName: string;
  candidates: Candidate[];
  tallies: VoteTally[];
  votes?: ElectionVote[];
  winner?: string;
  winnerName?: string;
  finalized: boolean;
  startDate: string;
  endDate: string;
  isLoading?: boolean;
}
```

### 5. ProposalCard (`ProposalCard.tsx`)

**Purpose**: Display proposals and handle Yes/No/Abstain voting

**Features**:
- Proposal details display
- Vote distribution (Yes/No)
- Voting power indicator
- Time remaining countdown
- Current vote tally with percentages
- Progress bars for vote visualization
- Already voted state

**Props**:
```typescript
interface ProposalCardProps {
  proposal: Proposal;
  userAddress?: string;
  userVote?: ProposalVote | null;
  votingPower?: number;
  onVoteSuccess?: () => void;
}
```

### 6. Governance Dashboard (`app/governance/page.tsx`)

**Purpose**: Main governance hub

**Features**:
- Tabbed interface with 4 sections:
  - Active Elections
  - Upcoming Elections
  - Past Elections (with results)
  - Active Proposals
- Statistics overview cards
- Create election button (admin only)
- Real-time data updates
- Responsive layout

## Admin Role Determination

### How Admin Roles Are Determined

Admin roles are determined through the Move smart contract at `contracts/sources/governance.move`:

1. **Admin Address**: Stored in the `Roles` struct on-chain
   ```move
   struct Roles has key {
       admin: address,
       advisor: address,
       president: address,
       vice_president: address,
       eboard_members: vector<address>,
   }
   ```

2. **Verification Flow**:
   ```
   User connects wallet
   → Frontend fetches admin address from contract
   → Compare user address with admin address
   → Set isAdmin flag accordingly
   ```

3. **Contract Functions**:
   - `get_admin()`: Returns the admin address
   - `is_eboard_member_public(address)`: Checks if user is e-board member
   - `is_advisor(address)`: Checks if user is advisor

4. **Frontend Implementation** (in `governance-utils.ts`):
   ```typescript
   export function isAdmin(userAddress: string, adminAddress: string): boolean {
     return userAddress.toLowerCase() === adminAddress.toLowerCase();
   }

   export function getUserRole(userAddress: string, roles: RolesData): UserRole {
     // Returns Admin, Advisor, President, VicePresident, EboardMember, or None
   }
   ```

### Role Hierarchy

1. **Admin**: Full control, can create elections, finalize results, execute proposals
2. **Advisor**: Higher voting weight (3), can vote on proposals and elections
3. **E-board Members** (President, VP, Members): Standard voting weight (2), can vote and create proposals
4. **Regular Members**: Cannot vote or participate in governance

## Voting Power Calculation Logic

### Voting Weight System

Based on the Move contracts (`governance.move` and `proposals.move`):

```move
const SCALE: u64 = 2;
const EBOARD_WEIGHT: u64 = 2;  // Represents 1.0
const ADVISOR_WEIGHT: u64 = 3;  // Represents 1.5
```

### Calculation Logic

1. **For Elections** (`governance.move`):
   ```typescript
   function getVotingWeight(role: UserRole): number {
     switch (role) {
       case UserRole.Advisor:
         return 3;  // 1.5x weight
       case UserRole.President:
       case UserRole.VicePresident:
       case UserRole.EboardMember:
         return 2;  // 1.0x weight
       default:
         return 0;  // Not eligible
     }
   }
   ```

2. **For Proposals** (`proposals.move`):
   - Same weight system as elections
   - Only e-board members and advisors can vote
   - Vote weight is accumulated in scaled form

3. **Frontend Display**:
   ```typescript
   // Display in UI
   <span>Your voting weight: <strong>{votingWeight}</strong></span>

   // Calculate vote percentage
   const percentage = (voteCount / totalVotes) * 100;
   ```

### Vote Tallying

**Elections**:
- Each vote is multiplied by voter's weight
- Tallies stored in `tallies_scaled: Table<address, u64>`
- Winner determined by highest scaled vote count

**Proposals**:
- Separate tallies for Yes (`yay_votes`) and No (`nay_votes`)
- Vote weight accumulated in each tally
- Proposal passes if `yay_votes > nay_votes`

### Eligibility Checks

**Can Vote on Proposals**:
```typescript
export function isEligibleToVoteOnProposals(role: UserRole): boolean {
  return [
    UserRole.Advisor,
    UserRole.President,
    UserRole.VicePresident,
    UserRole.EboardMember,
  ].includes(role);
}
```

**Can Create Proposals**:
```typescript
export function isEligibleToCreateProposals(role: UserRole): boolean {
  return [
    UserRole.President,
    UserRole.VicePresident,
    UserRole.EboardMember,
  ].includes(role);
}
```

**Can Vote in Elections**:
```typescript
export function isEligibleToVoteInElections(role: UserRole): boolean {
  return [
    UserRole.Advisor,
    UserRole.President,
    UserRole.VicePresident,
    UserRole.EboardMember,
  ].includes(role);
}
```

**Can Run for Election** (Nominate):
```typescript
export function isEligibleToRunForElection(role: UserRole): boolean {
  return [
    UserRole.President,
    UserRole.VicePresident,
    UserRole.EboardMember,
  ].includes(role);
}
```

### Important Notes

1. **Candidates Cannot Vote**: In elections, once someone nominates themselves as a candidate, they cannot vote in that election (enforced by contract)

2. **Weight Display**: The UI displays the actual weight (2 or 3), not the scaled representation

3. **Vote Percentage**: Calculated based on vote count, not weight, for fair representation

4. **Real-time Updates**: Tallies are fetched from the backend API which syncs with blockchain events

## Blockchain Integration

### TODO: Wallet Integration

The components include placeholder code for Aptos wallet integration:

```typescript
// Example from VotingCard.tsx
const handleVote = async (candidateAddress: string) => {
  // TODO: Integrate with Aptos wallet
  // const payload = {
  //   type: 'entry_function_payload',
  //   function: 'nyu_aptos_builder_camp::governance::vote',
  //   type_arguments: [],
  //   arguments: [
  //     Array.from(new TextEncoder().encode(roleName)),
  //     electionId,
  //     candidateAddress,
  //     Math.floor(Date.now() / 1000),
  //   ],
  // };

  // Submit transaction and wait for confirmation
};
```

### Required Integration Steps

1. Install Aptos wallet adapter:
   ```bash
   npm install @aptos-labs/wallet-adapter-react
   ```

2. Wrap app with wallet provider (see `lib/wallet/AptosWalletProvider.tsx`)

3. Update components to use wallet context

4. Submit transactions and handle responses

5. Call backend API to sync transaction results

## API Integration

All components integrate with existing API hooks:

- `useElections()` - Fetch elections with filters
- `useElectionDetails()` - Get specific election details
- `useProposals()` - Fetch proposals with filters
- `useActiveProposals()` - Get currently active proposals
- `useGovernanceStats()` - Get governance statistics
- `useRoles()` - Get current role assignments

## Styling & UI

- Uses existing UI components from `@/components/ui`
- Follows the application's design system
- Responsive design with mobile support
- Lucide React icons for consistency
- Toast notifications with `sonner`
- Skeleton loaders for better UX

## Testing Checklist

- [ ] Admin can create elections
- [ ] Non-admin cannot create elections
- [ ] E-board members can nominate themselves
- [ ] Eligible voters can cast votes
- [ ] Vote weight is correctly applied
- [ ] Already voted state is enforced
- [ ] Results display correctly
- [ ] Winner announcement shows properly
- [ ] Time remaining countdown works
- [ ] Proposals voting works
- [ ] Tabs navigation works
- [ ] Real-time updates function
- [ ] Mobile responsive design
- [ ] Error handling works

## Next Steps

1. Integrate Aptos wallet adapter
2. Connect transaction submission to blockchain
3. Test with real data from testnet
4. Add notification system for new elections/proposals
5. Implement user voting history page
6. Add export results functionality
7. Implement proposal creation UI
8. Add rich text editor for proposal descriptions
