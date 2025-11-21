import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { CHAINS, ChainId, DEFAULT_CHAIN_ID } from '../chains';

/**
 * Aptos blockchain client configuration and utilities
 * This module provides direct blockchain integration for fetching real-time data
 */

// Configuration
const NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK as Network) || Network.TESTNET;
const NODE_URL = process.env.NEXT_PUBLIC_APTOS_NODE_URL;
export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '0xCAFE';
export const COIN_TYPE = '0x1::aptos_coin::AptosCoin';
const APTOS_COIN_TYPE = COIN_TYPE; // Internal alias for backward compatibility
const MODULE_NAME = 'nyu_aptos_builder_camp';
const APTOS_CHAIN_ID: ChainId = DEFAULT_CHAIN_ID;
const APTOS_CHAIN = CHAINS[APTOS_CHAIN_ID];

// Initialize Aptos client
const config = NODE_URL
  ? new AptosConfig({ network: NETWORK, fullnode: NODE_URL })
  : new AptosConfig({ network: NETWORK });

export const aptosClient = new Aptos(config);

/**
 * Status constants from proposals.move
 */
export const ProposalStatus = {
  DRAFT: 0,
  ACTIVE: 1,
  PASSED: 2,
  REJECTED: 3,
  EXECUTED: 4,
} as const;

export const StatusNames: Record<number, string> = {
  0: 'Draft',
  1: 'Active',
  2: 'Passed',
  3: 'Rejected',
  4: 'Executed',
};

/**
 * Helper: Convert Move vector<u8> (byte array) to string
 */
export function bytesToString(bytes: number[] | Uint8Array): string {
  try {
    const arr = Array.isArray(bytes) ? bytes : Array.from(bytes);
    return new TextDecoder().decode(new Uint8Array(arr));
  } catch (error) {
    console.error('Failed to decode bytes:', error);
    return '';
  }
}

/**
 * Helper: Format APT amount (divide by 10^8)
 */
export function formatAPT(amount: string | number): string {
  const value = typeof amount === 'string' ? BigInt(amount) : BigInt(amount);
  const divisor = BigInt(100_000_000); // 10^8
  const apt = Number(value) / Number(divisor);
  return `${apt.toFixed(2)} APT`;
}

/**
 * Helper: Retry function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
}

/**
 * Helper: Check if error is a resource not found error
 */
function isResourceNotFoundError(error: any): boolean {
  return error?.message?.includes('resource_not_found') ||
         error?.error_code === 'resource_not_found' ||
         error?.status === 404;
}

/**
 * Get treasury balance from Vault resource
 */
export async function getTreasuryBalance(): Promise<{
  chainId: ChainId;
  chainDisplayName: string;
  balance: string;
  balanceFormatted: string;
  coinType: string;
  timestamp: string;
}> {
  try {
    const resourceType = `${MODULE_ADDRESS}::treasury::Vault<${APTOS_COIN_TYPE}>`;

    const resource = await withRetry(() =>
      aptosClient.getAccountResource({
        accountAddress: MODULE_ADDRESS,
        resourceType,
      })
    );

    const balance = (resource.balance as any)?.value || '0';

    return {
      chainId: APTOS_CHAIN_ID,
      chainDisplayName: APTOS_CHAIN.displayName,
      balance,
      balanceFormatted: formatAPT(balance),
      coinType: APTOS_COIN_TYPE,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Return empty data if contracts not deployed
    if (isResourceNotFoundError(error)) {
      console.warn('Contracts not deployed yet. Returning empty treasury balance.');
      return {
        chainId: APTOS_CHAIN_ID,
        chainDisplayName: APTOS_CHAIN.displayName,
        balance: '0',
        balanceFormatted: '0.00 APT',
        coinType: APTOS_COIN_TYPE,
        timestamp: new Date().toISOString(),
      };
    }
    console.error('Error fetching treasury balance:', error);
    throw new Error('Failed to fetch treasury balance from blockchain');
  }
}

/**
 * Get all proposals from ProposalsStore
 */
export async function getProposals(params?: {
  status?: number;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    const resourceType = `${MODULE_ADDRESS}::proposals::ProposalsStore`;

    const resource = await withRetry(() =>
      aptosClient.getAccountResource({
        accountAddress: MODULE_ADDRESS,
        resourceType,
      })
    );

    const store = resource as any;
    const nextId = Number(store.next_proposal_id || 0);

    // NOTE: Event querying is not supported in Aptos SDK v5.x
    // Events must be queried via:
    // 1. GraphQL Indexer API (recommended for production)
    // 2. REST API endpoints directly
    // 3. Transaction queries (events embedded in responses)
    //
    // For now, return empty array as contracts are not deployed yet.
    // TODO: Implement proper event querying when deploying to production
    const proposals: any[] = [];

    return proposals;
  } catch (error) {
    if (isResourceNotFoundError(error)) {
      console.warn('Contracts not deployed yet. Returning empty proposals.');
      return [];
    }
    console.error('Error fetching proposals:', error);
    throw new Error('Failed to fetch proposals from blockchain');
  }
}

/**
 * Get proposal details with votes
 */
export async function getProposalDetails(proposalId: number): Promise<any> {
  try {
    // NOTE: Event querying is not supported in Aptos SDK v5.x
    // TODO: Implement proper event querying via GraphQL Indexer or REST API
    const proposalVotes: any[] = [];

    // Calculate vote statistics
    const yayVoters = proposalVotes.filter((v: any) => v.vote === true).length;
    const nayVoters = proposalVotes.filter((v: any) => v.vote === false).length;

    return {
      proposal_id: proposalId,
      votes: proposalVotes,
      voteStats: {
        totalVoters: proposalVotes.length,
        yayVoters,
        nayVoters,
      },
    };
  } catch (error) {
    console.error(`Error fetching proposal ${proposalId} details:`, error);
    throw new Error('Failed to fetch proposal details from blockchain');
  }
}

/**
 * Get proposal statistics
 */
export async function getProposalStats(): Promise<any> {
  try {
    const resourceType = `${MODULE_ADDRESS}::proposals::ProposalsStore`;

    const resource = await withRetry(() =>
      aptosClient.getAccountResource({
        accountAddress: MODULE_ADDRESS,
        resourceType,
      })
    );

    const store = resource as any;
    const total = Number(store.next_proposal_id || 0);

    // NOTE: Event querying is not supported in Aptos SDK v5.x
    // TODO: Implement proper event querying via GraphQL Indexer or REST API
    const passed = 0;
    const rejected = 0;
    const executed = 0;
    const active = total;
    const uniqueVoters = new Set();
    const totalYay = 0;
    const totalNay = 0;

    return {
      proposals: {
        total,
        active,
        passed,
        rejected,
        executed,
      },
      votes: {
        uniqueVoters: uniqueVoters.size,
        totalVotes: 0,
        totalYay,
        totalNay,
      },
    };
  } catch (error) {
    if (isResourceNotFoundError(error)) {
      console.warn('Contracts not deployed yet. Returning empty proposal stats.');
      return {
        proposals: {
          total: 0,
          active: 0,
          passed: 0,
          rejected: 0,
          executed: 0,
        },
        votes: {
          uniqueVoters: 0,
          totalVotes: 0,
          totalYay: 0,
          totalNay: 0,
        },
      };
    }
    console.error('Error fetching proposal stats:', error);
    throw new Error('Failed to fetch proposal statistics from blockchain');
  }
}

/**
 * Get elections from governance module
 */
export async function getElections(params?: {
  role?: string;
  status?: 'finalized' | 'active';
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    // NOTE: Event querying is not supported in Aptos SDK v5.x
    // TODO: Implement proper event querying via GraphQL Indexer or REST API
    const elections: any[] = [];

    return elections;
  } catch (error) {
    if (isResourceNotFoundError(error)) {
      console.warn('Contracts not deployed yet. Returning empty elections.');
      return [];
    }
    console.error('Error fetching elections:', error);
    throw new Error('Failed to fetch elections from blockchain');
  }
}

/**
 * Get governance statistics
 */
export async function getGovernanceStats(): Promise<any> {
  try {
    const elections = await getElections();
    const finalized = elections.filter(e => e.finalized).length;
    const active = elections.filter(e => !e.finalized).length;

    // NOTE: Event querying is not supported in Aptos SDK v5.x
    // TODO: Implement proper event querying via GraphQL Indexer or REST API
    const uniqueVoters = new Set();
    const totalWeight = 0;

    return {
      elections: {
        total: elections.length,
        finalized,
        active,
        rolesWithElections: new Set(elections.map(e => e.role_name)).size,
      },
      votes: {
        uniqueVoters: uniqueVoters.size,
        totalVotes: 0,
        totalWeight: totalWeight.toString(),
      },
    };
  } catch (error) {
    if (isResourceNotFoundError(error)) {
      console.warn('Contracts not deployed yet. Returning empty governance stats.');
      return {
        elections: {
          total: 0,
          finalized: 0,
          active: 0,
          rolesWithElections: 0,
        },
        votes: {
          uniqueVoters: 0,
          totalVotes: 0,
          totalWeight: '0',
        },
      };
    }
    console.error('Error fetching governance stats:', error);
    throw new Error('Failed to fetch governance statistics from blockchain');
  }
}

/**
 * Get reimbursement requests from Treasury
 */
export async function getReimbursementRequests(params?: {
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    // NOTE: Event querying is not supported in Aptos SDK v5.x
    // TODO: Implement proper event querying via GraphQL Indexer or REST API
    const requests: any[] = [];

    return requests;
  } catch (error) {
    if (isResourceNotFoundError(error)) {
      console.warn('Contracts not deployed yet. Returning empty reimbursement requests.');
      return [];
    }
    console.error('Error fetching reimbursement requests:', error);
    throw new Error('Failed to fetch reimbursement requests from blockchain');
  }
}

/**
 * Get treasury statistics
 */
export async function getTreasuryStats(): Promise<any> {
  try {
    // NOTE: Event querying is not supported in Aptos SDK v5.x
    // TODO: Implement proper event querying via GraphQL Indexer or REST API
    const sponsorTotal = BigInt(0);
    const merchTotal = BigInt(0);
    const totalDeposits = sponsorTotal + merchTotal;

    // Fetch reimbursement stats
    const requests = await getReimbursementRequests();
    const paidRequests = requests.filter(r => r.paid_out);
    const pendingRequests = requests.filter(r => !r.paid_out);

    const totalPaid = paidRequests.reduce((sum, r) => sum + BigInt(r.amount), BigInt(0));
    const totalPending = pendingRequests.reduce((sum, r) => sum + BigInt(r.amount), BigInt(0));

    return {
      deposits: {
        sponsorTotal: sponsorTotal.toString(),
        merchTotal: merchTotal.toString(),
        totalDeposits: totalDeposits.toString(),
        depositCount: 0,
        sponsorTotalFormatted: formatAPT(sponsorTotal.toString()),
        merchTotalFormatted: formatAPT(merchTotal.toString()),
        totalDepositsFormatted: formatAPT(totalDeposits.toString()),
      },
      reimbursements: {
        totalRequests: requests.length,
        paidRequests: paidRequests.length,
        pendingRequests: pendingRequests.length,
        totalPaid: totalPaid.toString(),
        totalPending: totalPending.toString(),
        totalPaidFormatted: formatAPT(totalPaid.toString()),
        totalPendingFormatted: formatAPT(totalPending.toString()),
      },
    };
  } catch (error) {
    if (isResourceNotFoundError(error)) {
      console.warn('Contracts not deployed yet. Returning empty treasury stats.');
      return {
        deposits: {
          sponsorTotal: '0',
          merchTotal: '0',
          totalDeposits: '0',
          depositCount: 0,
          sponsorTotalFormatted: '0.00 APT',
          merchTotalFormatted: '0.00 APT',
          totalDepositsFormatted: '0.00 APT',
        },
        reimbursements: {
          totalRequests: 0,
          paidRequests: 0,
          pendingRequests: 0,
          totalPaid: '0',
          totalPending: '0',
          totalPaidFormatted: '0.00 APT',
          totalPendingFormatted: '0.00 APT',
        },
      };
    }
    console.error('Error fetching treasury stats:', error);
    throw new Error('Failed to fetch treasury statistics from blockchain');
  }
}

/**
 * Get transaction history using Aptos Indexer
 */
export async function getTransactionHistory(params?: {
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    // Query transactions involving the module account
    const transactions = await aptosClient.getAccountTransactions({
      accountAddress: MODULE_ADDRESS,
      options: {
        limit: params?.limit || 20,
        offset: params?.offset || 0,
      },
    });

    return transactions.map((tx: any) => ({
      chainId: APTOS_CHAIN_ID,
      version: tx.version,
      hash: tx.hash,
      type: tx.type,
      timestamp: new Date(Number(tx.timestamp) / 1000).toISOString(),
      success: tx.success,
      sender: tx.sender,
    }));
  } catch (error) {
    if (isResourceNotFoundError(error)) {
      console.warn('Contracts not deployed yet. Returning empty transaction history.');
      return [];
    }
    console.error('Error fetching transaction history:', error);
    throw new Error('Failed to fetch transaction history from blockchain');
  }
}

/**
 * Get current roles from governance
 */
export async function getRoles(): Promise<Record<string, { address: string; displayName: string }>> {
  try {
    const resourceType = `${MODULE_ADDRESS}::governance::Roles`;

    const resource = await withRetry(() =>
      aptosClient.getAccountResource({
        accountAddress: MODULE_ADDRESS,
        resourceType,
      })
    );

    const roles = resource as any;

    return {
      admin: {
        address: roles.admin,
        displayName: 'Admin',
      },
      advisor: {
        address: roles.advisor,
        displayName: 'Advisor',
      },
      president: {
        address: roles.president,
        displayName: 'President',
      },
      vice_president: {
        address: roles.vice_president,
        displayName: 'Vice President',
      },
    };
  } catch (error) {
    if (isResourceNotFoundError(error)) {
      console.warn('Contracts not deployed yet. Returning empty roles.');
      return {
        admin: { address: '0x0', displayName: 'Admin' },
        advisor: { address: '0x0', displayName: 'Advisor' },
        president: { address: '0x0', displayName: 'President' },
        vice_president: { address: '0x0', displayName: 'Vice President' },
      };
    }
    console.error('Error fetching roles:', error);
    throw new Error('Failed to fetch roles from blockchain');
  }
}

export default aptosClient;
