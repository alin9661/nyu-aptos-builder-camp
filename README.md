# NYU Aptos Builder Camp - Governance & Treasury

A production-ready Aptos Move package providing weighted voting governance and multisig treasury management for e-board operations.

## Overview

This package contains two main modules:

1. **governance.move** - Weighted voting system for e-board role elections
2. **treasury.move** - Stablecoin vault with multisig reimbursement approvals

## Project Structure

```
nyu-aptos-builder-camp/
├── Move.toml              # Package configuration
├── Sources/
│   ├── governance.move    # Weighted voting module
│   └── treasury.move      # Vault and reimbursement module
├── tests/
│   ├── governance_test.move
│   └── treasury_test.move
└── README.md
```

## Setup

### 1. Address Configuration

The `Move.toml` file uses the following addresses:

- `0xLAB` - The publishing account / module address (`@nyu_aptos_builder_camp`)
- `0xADVISOR` - Advisor role address (`@advisor`)
- `0xPRESIDENT` - President role address (`@president`)
- `0xVICE` - Vice President role address (`@vice`)

To use your own addresses, edit `Move.toml`:

```toml
[addresses]
nyu_aptos_builder_camp = "0xYOUR_MODULE_ADDRESS"
advisor = "0xYOUR_ADVISOR_ADDRESS"
president = "0xYOUR_PRESIDENT_ADDRESS"
vice = "0xYOUR_VICE_ADDRESS"
```

### 2. Build

```bash
aptos move compile
```

### 3. Run Tests

```bash
aptos move test
```

### 4. Publish to Testnet/Mainnet

```bash
# Set your profile
aptos init --profile builder_camp

# Publish the package
aptos move publish --profile builder_camp
```

## Module 1: Governance (Weighted Voting)

### Key Features

- **Weighted Voting**: Advisor votes have weight 3, e-board members have weight 2
- **Candidate Restrictions**: Candidates cannot vote in their own elections
- **Time-bound Elections**: Voting only allowed within `[start_ts, end_ts)` window
- **Tie Handling**: Ties result in no winner, requiring a run-off election

### Voting Weights

- **E-board Member**: weight = 2 (represents 1.0)
- **Advisor**: weight = 3 (represents 1.5)
- **President/Vice**: No special weights (treated as e-board if in e-board list)

### Functions

#### Initialize Roles

```bash
aptos move run \
  --function-id '0xLAB::governance::init_roles' \
  --args address:0xADVISOR \
         address:0xPRESIDENT \
         address:0xVICE \
         'vector<address>:[0xEBOARD1,0xEBOARD2,0xEBOARD3]' \
  --profile admin
```

#### Start Election

```bash
aptos move run \
  --function-id '0xLAB::governance::start_election' \
  --args 'u8 vector:[80,82,69,83,73,68,69,78,84]' \  # "PRESIDENT"
         u64:1 \
         u64:1704067200 \  # start_ts
         u64:1704153600 \  # end_ts
  --profile admin
```

#### Add Candidate

```bash
aptos move run \
  --function-id '0xLAB::governance::add_candidate' \
  --args 'u8 vector:[80,82,69,83,73,68,69,78,84]' \
         u64:1 \
         address:0xCANDIDATE1 \
  --profile admin
```

#### Cast Vote

```bash
aptos move run \
  --function-id '0xLAB::governance::cast_vote' \
  --args 'u8 vector:[80,82,69,83,73,68,69,78,84]' \
         u64:1 \
         address:0xCANDIDATE1 \
         u64:1704070000 \
  --profile voter
```

#### Finalize Election

```bash
aptos move run \
  --function-id '0xLAB::governance::finalize_election' \
  --args 'u8 vector:[80,82,69,83,73,68,69,78,84]' \
         u64:1 \
         u64:1704153600 \
  --profile admin
```

#### Get Winner

```bash
aptos move view \
  --function-id '0xLAB::governance::get_winner' \
  --args 'u8 vector:[80,82,69,83,73,68,69,78,84]' \
         u64:1
```

### Example Flow: Complete Election

1. **Initialize roles** (one-time setup)
2. **Start election** for "PRESIDENT" role
3. **Add candidates**: `add_candidate` for each candidate
4. **Vote**: Eligible voters call `cast_vote`
5. **Finalize**: Admin calls `finalize_election` after `end_ts`
6. **Check winner**: Call `get_winner` to see result

### Events

- `CandidateAddedEvent` - Emitted when a candidate is added
- `VoteCastEvent` - Emitted when a vote is cast (includes voter, candidate, weight)
- `ElectionFinalizedEvent` - Emitted when election is finalized (includes winner and tie status)

## Module 2: Treasury (Vault & Reimbursements)

### Key Features

- **Stablecoin Vault**: Central vault for sponsor and merch revenue
- **Multisig Approvals**: All three (advisor, president, vice) must approve reimbursements
- **E-board Submissions**: Only e-board members can submit reimbursement requests
- **Invoice Tracking**: Stores invoice URI and hash (off-chain storage)

### Approval Policy

**ALL THREE** of the following must approve:
- Advisor (`approved_advisor = true`)
- President (`approved_president = true`)
- Vice President (`approved_vice = true`)

### Functions

#### Initialize Vault

```bash
aptos move run \
  --function-id '0xLAB::treasury::init_vault' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --profile admin
```

#### Deposit Sponsor Funds

```bash
aptos move run \
  --function-id '0xLAB::treasury::deposit_sponsor' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:100000000 \  # Amount in smallest units (octas)
  --profile sponsor
```

#### Deposit Merch Revenue

```bash
aptos move run \
  --function-id '0xLAB::treasury::deposit_merch' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:50000000 \
  --profile merch_account
```

#### Submit Reimbursement Request

```bash
aptos move run \
  --function-id '0xLAB::treasury::submit_reimbursement' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:25000000 \
         'u8 vector:[104,116,116,112,115,58,47,47,101,120,97,109,112,108,101,46,99,111,109,47,105,110,118,111,105,99,101,46,112,100,102]' \  # "https://example.com/invoice.pdf"
         'u8 vector:[97,98,99,49,50,51]' \  # "abc123" (invoice hash)
         u64:1704070000 \
  --profile eboard_member
```

#### Approve Reimbursement (Advisor)

```bash
aptos move run \
  --function-id '0xLAB::treasury::approve_reimbursement' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:0 \
  --profile advisor
```

#### Approve Reimbursement (President)

```bash
aptos move run \
  --function-id '0xLAB::treasury::approve_reimbursement' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:0 \
  --profile president
```

#### Approve Reimbursement (Vice)

```bash
aptos move run \
  --function-id '0xLAB::treasury::approve_reimbursement' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:0 \
  --profile vice
```

#### Execute Reimbursement Payment

```bash
aptos move run \
  --function-id '0xLAB::treasury::execute_reimbursement' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:0 \
  --profile executor  # Anyone can execute, but all approvals must be present
```

### Example Flow: Reimbursement Process

1. **Initialize vault** (one-time setup)
2. **Deposit funds**: Sponsors/merch accounts deposit via `deposit_sponsor` or `deposit_merch`
3. **Submit request**: E-board member calls `submit_reimbursement` with invoice details
4. **Collect approvals**:
   - Advisor calls `approve_reimbursement`
   - President calls `approve_reimbursement`
   - Vice calls `approve_reimbursement`
5. **Execute payment**: Anyone calls `execute_reimbursement` (after all approvals)

### Events

- `DepositReceivedEvent` - Emitted on sponsor/merch deposits (includes source and amount)
- `ReimbursementSubmittedEvent` - Emitted when request is submitted
- `ReimbursementApprovedEvent` - Emitted on each approval (includes approver role)
- `ReimbursementPaidEvent` - Emitted when payment is executed

## Error Codes

### Governance Errors

- `E_NOT_ADMIN (1)` - Caller is not the admin
- `E_NOT_EBOARD (2)` - Caller is not an e-board member
- `E_CANDIDATE_CANNOT_VOTE (3)` - Candidate attempted to vote
- `E_ALREADY_VOTED (4)` - Voter already cast a vote
- `E_VOTING_CLOSED (5)` - Voting window closed or invalid
- `E_INVALID_CANDIDATE (6)` - Candidate not in election
- `E_ELECTION_NOT_FOUND (7)` - Election does not exist
- `E_ALREADY_FINALIZED (8)` - Election already finalized
- `E_TIE_NEEDS_RUNOFF (9)` - Election tied, needs run-off
- `E_NOT_ELIGIBLE_VOTER (10)` - Voter not eligible (not advisor or e-board)

### Treasury Errors

- `E_NOT_ADMIN (1)` - Caller is not the admin
- `E_NOT_EBOARD (2)` - Caller is not an e-board member
- `E_REQUEST_NOT_FOUND (3)` - Reimbursement request not found
- `E_ALREADY_PAID (4)` - Request already paid out
- `E_NOT_ALL_APPROVED (5)` - Not all required approvals present
- `E_INSUFFICIENT_BALANCE (6)` - Vault balance insufficient
- `E_NOT_ROLE (7)` - Approver is not advisor/president/vice
- `E_ALREADY_APPROVED (8)` - Approver already approved this request
- `E_PAUSED (9)` - Treasury operations are paused

## Security Considerations

1. **Role Checks**: All functions verify caller roles before execution
2. **Reentrancy Safety**: Uses Move's linear type system and explicit coin transfers
3. **Time Validation**: Elections enforce time windows; reimbursements use timestamps
4. **Multisig Enforcement**: Reimbursements require all three approvals
5. **Balance Checks**: Payments verify sufficient vault balance
6. **Pause Mechanism**: Admin can pause treasury operations in emergencies

## Design Choices

1. **Integer Weights**: Uses fixed-point scale factor (SCALE=2) instead of floating point
2. **Single Active Election**: Current design supports one election at a time (can be extended with Tables for multiple concurrent elections)
3. **Off-chain Invoice Storage**: Only stores URI and hash, not full invoice data
4. **Cross-Module Access**: Treasury reads roles from governance module via public getters
5. **Tie Handling**: Ties result in no winner, requiring manual run-off election

## Testing

Run all tests:

```bash
aptos move test
```

Run specific test:

```bash
aptos move test --filter test_init_roles
```

## Production Deployment Checklist

- [ ] Update addresses in `Move.toml` to production addresses
- [ ] Test all functions on testnet
- [ ] Verify event emissions
- [ ] Test edge cases (ties, insufficient funds, etc.)
- [ ] Set up monitoring for events
- [ ] Document invoice URI format and storage requirements
- [ ] Consider adding cancellation reason field to reimbursements
- [ ] Consider extending to support multiple concurrent elections via Table storage

## License

This package is provided for educational and production use in the NYU Aptos Builder Camp.

