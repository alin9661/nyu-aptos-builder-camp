// Common API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<{
  [key: string]: T[];
  pagination: Pagination;
}> {}

// Treasury Types
export interface TreasuryBalance {
  balance: string;
  balanceFormatted: string;
  coinType: string;
  timestamp: string;
}

export interface Transaction {
  id: number;
  source: string;
  amount: string;
  total_balance: string;
  amountFormatted: string;
  totalBalanceFormatted: string;
  transaction_hash: string;
  version: string;
  block_height: number;
  timestamp: string;
}

export interface TreasuryStats {
  deposits: {
    sponsorTotal: string;
    merchTotal: string;
    totalDeposits: string;
    depositCount: number;
    sponsorTotalFormatted: string;
    merchTotalFormatted: string;
    totalDepositsFormatted: string;
  };
  reimbursements: {
    totalRequests: number;
    paidRequests: number;
    pendingRequests: number;
    totalPaid: string;
    totalPending: string;
    totalPaidFormatted: string;
    totalPendingFormatted: string;
  };
}

export interface ReimbursementRequest {
  id: number;
  payer: string;
  payee: string;
  amount: string;
  amountFormatted: string;
  description: string;
  paid_out: boolean;
  created_ts: string;
  payout_ts?: string;
  payer_name?: string;
  payee_name?: string;
}

export interface Approval {
  id: number;
  request_id: number;
  approver: string;
  approver_name?: string;
  timestamp: string;
  transaction_hash: string;
}

export interface InvoiceMetadata {
  ipfs_hash: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export interface ReimbursementDetails extends ReimbursementRequest {
  approvals: Approval[];
  ipfs_hash?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
}

export interface TransactionSubmission {
  transactionHash: string;
  version: string;
  success: boolean;
}

// Governance Types
export interface Candidate {
  candidate: string;
  display_name?: string;
  timestamp: string;
}

export interface VoteTally {
  candidate: string;
  total_weight: string;
  vote_count: number;
}

export interface Election {
  election_id: number;
  role_name: string;
  start_ts: string;
  end_ts: string;
  finalized: boolean;
  winner?: string;
  winner_name?: string;
  candidates: Candidate[];
  tallies: VoteTally[];
}

export interface ElectionVote {
  voter: string;
  candidate: string;
  weight: string;
  timestamp: string;
  voter_name?: string;
  candidate_name?: string;
}

export interface ElectionDetails extends Election {
  votes: ElectionVote[];
}

export interface Role {
  address: string;
  displayName: string;
}

export interface Member {
  address: string;
  role: string;
  display_name: string;
  email?: string;
  created_at: string;
}

export interface GovernanceStats {
  elections: {
    total: number;
    finalized: number;
    active: number;
    rolesWithElections: number;
  };
  votes: {
    uniqueVoters: number;
    totalVotes: number;
    totalWeight: string;
  };
  recentElections: Array<{
    election_id: number;
    role_name: string;
    start_ts: string;
    end_ts: string;
    finalized: boolean;
    winner?: string;
    winner_name?: string;
    candidate_count: number;
  }>;
}

// Proposals Types
export interface VoteStats {
  totalVoters: number;
  yayVoters: number;
  nayVoters: number;
  yayWeight?: string;
  nayWeight?: string;
}

export interface Proposal {
  proposal_id: number;
  title: string;
  description: string;
  creator: string;
  creator_name?: string;
  status: number;
  statusName: string;
  yay_votes: string;
  nay_votes: string;
  start_ts: string;
  end_ts: string;
  voteStats: VoteStats;
}

export interface ProposalVote {
  voter: string;
  vote: boolean;
  weight: string;
  timestamp: string;
  voter_name?: string;
}

export interface ProposalDetails extends Proposal {
  votes: ProposalVote[];
}

export interface ProposalStats {
  proposals: {
    total: number;
    active: number;
    passed: number;
    rejected: number;
    executed: number;
  };
  votes: {
    uniqueVoters: number;
    totalVotes: number;
    totalYay: number;
    totalNay: number;
  };
  recentProposals: Array<{
    proposal_id: number;
    title: string;
    creator: string;
    status: number;
    statusName: string;
    start_ts: string;
    end_ts: string;
    creator_name?: string;
  }>;
}

// Query Parameters Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
}

export interface ElectionFilters extends PaginationParams {
  role?: string;
  status?: 'finalized' | 'active';
}

export interface ProposalFilters extends PaginationParams {
  status?: number;
  creator?: string;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  description: string;
  logo?: string;
  memberCount?: number;
  hasAccess: boolean;
}

// Health Check Type
export interface HealthCheck {
  status: string;
  timestamp: string;
  environment: string;
  database: string;
  network: {
    network: string;
    chainId: string;
    nodeUrl: string;
  };
  version: string;
}

// Notification Types
export type NotificationCategory =
  | 'wallet'
  | 'security'
  | 'governance'
  | 'reimbursement'
  | 'treasury'
  | 'education'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: number;
  user_address: string;
  notification_type: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  user_address: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  categories: {
    wallet: boolean;
    security: boolean;
    governance: boolean;
    reimbursement: boolean;
    treasury: boolean;
    education: boolean;
    system: boolean;
  };
  email_digest_frequency?: 'instant' | 'daily' | 'weekly' | 'never';
  updated_at?: string;
}

export interface NotificationFilters extends PaginationParams {
  category?: NotificationCategory;
  read?: boolean;
  priority?: NotificationPriority;
}

// Compliance Types
export type ConsentType =
  | 'WALLET_GENERATION'
  | 'PRIVATE_KEY_STORAGE'
  | 'DATA_PROCESSING'
  | 'ANALYTICS'
  | 'NOTIFICATIONS'
  | 'THIRD_PARTY_SHARING';

export interface ConsentRecord {
  id: number;
  user_address: string;
  consent_type: ConsentType;
  granted: boolean;
  version: string;
  granted_at?: string;
  revoked_at?: string;
  ip_address?: string;
}

export interface ConsentStatus {
  [key: string]: {
    granted: boolean;
    version: string;
    granted_at?: string;
    revoked_at?: string;
  };
}

export interface AuditLogEntry {
  id: number;
  user_address: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface AuditFilters extends PaginationParams {
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface DataExport {
  user_address: string;
  profile: any;
  wallets: any[];
  reimbursements: any[];
  votes: any[];
  consents: ConsentRecord[];
  audit_trail: AuditLogEntry[];
  notifications: Notification[];
  exported_at: string;
}
