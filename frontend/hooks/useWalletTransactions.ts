/**
 * Custom hook for wallet transaction operations
 *
 * Provides higher-level abstractions for common transaction patterns
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@/lib/wallet';
import { TransactionPayload } from '@/lib/types/wallet';

export interface TransactionStatus {
  loading: boolean;
  success: boolean;
  error: string | null;
  txHash: string | null;
}

/**
 * Hook for managing wallet transactions with loading states
 */
export function useWalletTransactions() {
  const wallet = useWallet();
  const [status, setStatus] = useState<TransactionStatus>({
    loading: false,
    success: false,
    error: null,
    txHash: null,
  });

  /**
   * Execute a transaction with automatic state management
   */
  const executeTransaction = useCallback(
    async (payload: TransactionPayload) => {
      if (!wallet.connected) {
        setStatus({
          loading: false,
          success: false,
          error: 'Wallet not connected',
          txHash: null,
        });
        return null;
      }

      setStatus({
        loading: true,
        success: false,
        error: null,
        txHash: null,
      });

      try {
        const response = await wallet.signAndSubmitTransaction(payload);

        setStatus({
          loading: false,
          success: true,
          error: null,
          txHash: response.hash,
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Transaction failed';

        setStatus({
          loading: false,
          success: false,
          error: errorMessage,
          txHash: null,
        });

        return null;
      }
    },
    [wallet]
  );

  /**
   * Reset transaction status
   */
  const resetStatus = useCallback(() => {
    setStatus({
      loading: false,
      success: false,
      error: null,
      txHash: null,
    });
  }, []);

  /**
   * Helper for voting on proposals
   */
  const voteOnProposal = useCallback(
    async (
      contractAddress: string,
      proposalId: number,
      vote: boolean
    ) => {
      const payload: TransactionPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::proposals::vote`,
        type_arguments: [],
        arguments: [proposalId, vote],
      };

      return executeTransaction(payload);
    },
    [executeTransaction]
  );

  /**
   * Helper for creating proposals
   */
  const createProposal = useCallback(
    async (
      contractAddress: string,
      title: string,
      description: string,
      durationSecs: number
    ) => {
      const payload: TransactionPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::proposals::create_proposal`,
        type_arguments: [],
        arguments: [title, description, durationSecs],
      };

      return executeTransaction(payload);
    },
    [executeTransaction]
  );

  /**
   * Helper for executing proposals
   */
  const executeProposal = useCallback(
    async (contractAddress: string, proposalId: number) => {
      const payload: TransactionPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::proposals::execute_proposal`,
        type_arguments: [],
        arguments: [proposalId],
      };

      return executeTransaction(payload);
    },
    [executeTransaction]
  );

  /**
   * Helper for treasury deposits
   */
  const depositToTreasury = useCallback(
    async (
      contractAddress: string,
      amount: number,
      source: string
    ) => {
      const payload: TransactionPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::treasury::deposit`,
        type_arguments: [],
        arguments: [amount, source],
      };

      return executeTransaction(payload);
    },
    [executeTransaction]
  );

  /**
   * Helper for reimbursement requests
   */
  const requestReimbursement = useCallback(
    async (
      contractAddress: string,
      payee: string,
      amount: number,
      description: string
    ) => {
      const payload: TransactionPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::treasury::request_reimbursement`,
        type_arguments: [],
        arguments: [payee, amount, description],
      };

      return executeTransaction(payload);
    },
    [executeTransaction]
  );

  /**
   * Helper for approving reimbursements
   */
  const approveReimbursement = useCallback(
    async (contractAddress: string, requestId: number) => {
      const payload: TransactionPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::treasury::approve_reimbursement`,
        type_arguments: [],
        arguments: [requestId],
      };

      return executeTransaction(payload);
    },
    [executeTransaction]
  );

  /**
   * Helper for voting in elections
   */
  const voteInElection = useCallback(
    async (
      contractAddress: string,
      electionId: number,
      candidate: string
    ) => {
      const payload: TransactionPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::governance::vote`,
        type_arguments: [],
        arguments: [electionId, candidate],
      };

      return executeTransaction(payload);
    },
    [executeTransaction]
  );

  return {
    // Wallet state
    ...wallet,

    // Transaction state
    ...status,

    // Transaction methods
    executeTransaction,
    resetStatus,

    // Helper methods
    voteOnProposal,
    createProposal,
    executeProposal,
    depositToTreasury,
    requestReimbursement,
    approveReimbursement,
    voteInElection,
  };
}

/**
 * Hook for transaction history tracking
 */
export function useTransactionHistory() {
  const [history, setHistory] = useState<Array<{
    hash: string;
    timestamp: number;
    status: 'pending' | 'success' | 'failed';
    description?: string;
  }>>([]);

  const addTransaction = useCallback((
    hash: string,
    description?: string
  ) => {
    setHistory((prev) => [
      {
        hash,
        timestamp: Date.now(),
        status: 'pending',
        description,
      },
      ...prev,
    ]);
  }, []);

  const updateTransaction = useCallback((
    hash: string,
    status: 'success' | 'failed'
  ) => {
    setHistory((prev) =>
      prev.map((tx) =>
        tx.hash === hash ? { ...tx, status } : tx
      )
    );
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addTransaction,
    updateTransaction,
    clearHistory,
  };
}
