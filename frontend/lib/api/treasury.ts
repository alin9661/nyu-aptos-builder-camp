import {
  getTreasuryBalance as getBalanceFromChain,
  getTreasuryStats as getStatsFromChain,
  getReimbursementRequests,
  getTransactionHistory,
} from './aptos';
import {
  ApiResponse,
  TreasuryBalance,
  Transaction,
  TreasuryStats,
  ReimbursementRequest,
  ReimbursementDetails,
  TransactionSubmission,
  PaginationParams,
  Pagination,
  ChainBalance,
  TreasuryOverview,
} from '../types/api';
import { CHAINS, DEFAULT_CHAIN_ID } from '../chains';

const APTOS_CHAIN_ID = DEFAULT_CHAIN_ID;
const APTOS_CHAIN = CHAINS[APTOS_CHAIN_ID];

/**
 * Treasury API module
 * Now uses direct blockchain integration instead of backend API
 */

/**
 * Plan A cross-chain overview (currently Aptos-only).
 * Wraps the existing balance call so we can add Ethereum/others later.
 */
export async function getTreasuryOverview(): Promise<ApiResponse<TreasuryOverview>> {
  try {
    const balance = await getBalanceFromChain();

    const aptosChain: ChainBalance = {
      chainId: balance.chainId ?? APTOS_CHAIN_ID,
      balance: balance.balance,
      balanceFormatted: balance.balanceFormatted,
      coinType: balance.coinType,
      nativeTokenSymbol: APTOS_CHAIN.nativeTokenSymbol,
      timestamp: balance.timestamp,
    };

    return {
      success: true,
      data: {
        chains: [aptosChain],
        totalBalance: balance.balance,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch treasury overview',
    };
  }
}

/**
 * Get current vault balance from blockchain (backwards compatibility wrapper)
 */
export async function getTreasuryBalance(): Promise<ApiResponse<TreasuryBalance>> {
  const overview = await getTreasuryOverview();

  if (!overview.success || !overview.data) {
    return {
      success: false,
      error: overview.error || 'Failed to fetch treasury balance',
    };
  }

  const [aptos] = overview.data.chains;

  if (!aptos) {
    return {
      success: false,
      error: 'No chains available in treasury overview',
    };
  }

  return {
    success: true,
    data: {
      chainId: aptos.chainId,
      chainDisplayName: APTOS_CHAIN.displayName,
      balance: aptos.balance,
      balanceFormatted: aptos.balanceFormatted || '0.00 APT',
      coinType: aptos.coinType || '0x1::aptos_coin::AptosCoin',
      timestamp: aptos.timestamp || new Date().toISOString(),
    },
  };
}

/**
 * Get transaction history with pagination from blockchain
 */
export async function getTreasuryTransactions(
  params?: PaginationParams
): Promise<
  ApiResponse<{
    transactions: Transaction[];
    pagination: Pagination;
  }>
> {
  try {
    const limit = params?.limit || 20;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;

    const txs = await getTransactionHistory({ limit: limit + 1, offset });
    const hasMore = txs.length > limit;
    const transactions = hasMore ? txs.slice(0, limit) : txs;

    // Transform to match Transaction type
    const formattedTxs: Transaction[] = transactions.map((tx, index) => ({
      id: offset + index,
      chainId: tx.chainId ?? APTOS_CHAIN_ID,
      source: tx.sender === tx.sender ? 'DEPOSIT' : 'REIMBURSEMENT', // Simplified
      amount: '0', // Would need to parse events for actual amounts
      total_balance: '0',
      amountFormatted: '0 APT',
      totalBalanceFormatted: '0 APT',
      transaction_hash: tx.hash,
      version: tx.version,
      block_height: 0, // Not available in simple query
      timestamp: tx.timestamp,
    }));

    return {
      success: true,
      data: {
        transactions: formattedTxs,
        pagination: {
          page,
          limit,
          total: offset + transactions.length + (hasMore ? 1 : 0),
          totalPages: Math.ceil((offset + transactions.length + (hasMore ? 1 : 0)) / limit),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    };
  }
}

/**
 * Get treasury statistics from blockchain
 */
export async function getTreasuryStats(): Promise<ApiResponse<TreasuryStats>> {
  try {
    const data = await getStatsFromChain();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch treasury stats',
    };
  }
}

/**
 * Get all reimbursement requests with pagination from blockchain
 */
export async function getReimbursements(
  params?: PaginationParams
): Promise<
  ApiResponse<{
    requests: ReimbursementRequest[];
    pagination: Pagination;
  }>
> {
  try {
    const limit = params?.limit || 20;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;

    const allRequests = await getReimbursementRequests({ limit: limit + 1, offset });
    const hasMore = allRequests.length > limit;
    const requests = hasMore ? allRequests.slice(0, limit) : allRequests;

    // Transform to match ReimbursementRequest type
    const formattedRequests: ReimbursementRequest[] = requests.map(req => ({
      id: req.id,
      payer: req.payer,
      payee: req.payee,
      amount: req.amount,
      amountFormatted: req.amountFormatted,
      description: req.invoice_uri || 'Reimbursement request',
      paid_out: req.paid_out,
      created_ts: req.created_ts,
    }));

    return {
      success: true,
      data: {
        requests: formattedRequests,
        pagination: {
          page,
          limit,
          total: offset + requests.length + (hasMore ? 1 : 0),
          totalPages: Math.ceil((offset + requests.length + (hasMore ? 1 : 0)) / limit),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reimbursements',
    };
  }
}

/**
 * Get specific reimbursement request details from blockchain
 */
export async function getReimbursementDetails(
  id: number
): Promise<ApiResponse<ReimbursementDetails>> {
  try {
    const allRequests = await getReimbursementRequests();
    const request = allRequests.find(r => r.id === id);

    if (!request) {
      return {
        success: false,
        error: 'Reimbursement request not found',
      };
    }

    // Note: Approvals would need to be fetched from approval events
    const details: ReimbursementDetails = {
      id: request.id,
      payer: request.payer,
      payee: request.payee,
      amount: request.amount,
      amountFormatted: request.amountFormatted,
      description: request.invoice_uri || 'Reimbursement request',
      paid_out: request.paid_out,
      created_ts: request.created_ts,
      approvals: [], // Would fetch from ReimbursementApprovedEvent
    };

    return {
      success: true,
      data: details,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reimbursement details',
    };
  }
}

/**
 * Submit new reimbursement request
 * Note: This should be called AFTER the transaction is submitted to blockchain
 */
export async function submitReimbursement(
  transactionHash: string
): Promise<ApiResponse<TransactionSubmission>> {
  // This is a placeholder - in a real implementation, you might want to:
  // 1. Verify the transaction on-chain
  // 2. Store metadata in a separate database
  // For now, we just return success
  return {
    success: true,
    data: {
      transactionHash,
      version: '0',
      success: true,
    },
  };
}

/**
 * Record reimbursement approval
 * Note: This should be called AFTER the transaction is submitted to blockchain
 */
export async function approveReimbursement(
  id: number,
  transactionHash: string
): Promise<ApiResponse<TransactionSubmission>> {
  // This is a placeholder - in a real implementation, you might want to:
  // 1. Verify the transaction on-chain
  // 2. Update approval status in a separate database
  return {
    success: true,
    data: {
      transactionHash,
      version: '0',
      success: true,
    },
  };
}
