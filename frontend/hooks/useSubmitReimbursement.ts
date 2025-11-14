'use client';

import { useState, useCallback } from 'react';
import { useAptosWallet } from '@/lib/wallet/WalletProvider';
import { aptosClient, MODULE_ADDRESS, COIN_TYPE } from '@/lib/api/aptos';
import { submitReimbursement } from '@/lib/api/treasury';
import { getExplorerUrl } from '@/lib/wallet/utils';
import { Network } from '@/lib/types/wallet';

type TransactionState =
  | 'idle'
  | 'signing'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'recording'
  | 'success'
  | 'error';

export interface SubmitReimbursementParams {
  payee: string;
  amount: number; // in APT
  description: string;
  invoiceUri?: string;
  invoiceHash?: string;
}

export interface TransactionDetails {
  hash: string;
  version?: string;
  timestamp: number;
  gasUsed?: number;
  success: boolean;
  vmStatus?: string;
}

export function useSubmitReimbursement() {
  const { wallet, account, signAndSubmitTransaction, network, switchNetwork } = useAptosWallet();
  const [state, setState] = useState<TransactionState>('idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<SubmitReimbursementParams | null>(null);

  const submit = useCallback(
    async (params: SubmitReimbursementParams) => {
      setLastParams(params);
      setError(null);
      setTransactionHash(null);
      setTransactionDetails(null);
      setExplorerUrl(null);

      try {
        // Check wallet connection
        if (!wallet || !account) {
          throw new Error('Please connect your wallet first');
        }

        // Ensure wallet is on testnet
        if (network?.name !== Network.TESTNET) {
          await switchNetwork(Network.TESTNET);
        }

        // 1. SIGNING STATE
        setState('signing');

        // Convert APT to octas
        const amountInOctas = Math.floor(params.amount * 100000000);

        // Convert strings to Uint8Array for Move vector<u8>
        const descriptionBytes = new TextEncoder().encode(params.description);
        const invoiceUriBytes = new TextEncoder().encode(params.invoiceUri || '');
        const invoiceHashBytes = new TextEncoder().encode(params.invoiceHash || '');

        // Submit transaction to blockchain
        const response = await signAndSubmitTransaction({
          type: 'entry_function_payload',
          function: `${MODULE_ADDRESS}::treasury::submit_reimbursement`,
          type_arguments: [COIN_TYPE],
          arguments: [
            params.payee,
            amountInOctas.toString(),
            Array.from(descriptionBytes),
            Array.from(invoiceUriBytes),
            Array.from(invoiceHashBytes),
          ],
        });

        // 2. SUBMITTED STATE
        setState('submitted');
        const txHash = response.hash;
        setTransactionHash(txHash);

        // Generate explorer URL immediately
        const targetNetwork = 'testnet';
        const url = getExplorerUrl('transaction', txHash, targetNetwork);
        setExplorerUrl(url);

        // 3. CONFIRMING STATE
        setState('confirming');
        const txResult = await aptosClient.waitForTransaction({
          transactionHash: txHash,
        });

        // 4. CONFIRMED STATE
        setState('confirmed');

        // Parse transaction details
        const details: TransactionDetails = {
          hash: txHash,
          version: txResult.version,
          timestamp: Date.now(),
          gasUsed: txResult.gas_used ? parseInt(txResult.gas_used) : undefined,
          success: txResult.success,
          vmStatus: txResult.vm_status,
        };
        setTransactionDetails(details);

        if (!txResult.success) {
          throw new Error(`Transaction failed on blockchain: ${txResult.vm_status || 'Unknown error'}`);
        }

        // 5. RECORDING STATE
        setState('recording');
        const backendResponse = await submitReimbursement(txHash);

        if (!backendResponse.success) {
          throw new Error('Failed to record transaction on backend: ' + backendResponse.error);
        }

        // 6. SUCCESS STATE
        setState('success');

      } catch (err: any) {
        setState('error');

        // User-friendly error messages
        let errorMessage = 'An unexpected error occurred';

        if (err.message?.includes('User rejected')) {
          errorMessage = 'Transaction signature was rejected';
        } else if (err.message?.includes('connect your wallet')) {
          errorMessage = err.message;
        } else if (err.message?.includes('Transaction failed on blockchain')) {
          errorMessage = err.message;
        } else if (err.message?.includes('Failed to record transaction')) {
          errorMessage = err.message;
        } else if (err.message?.includes('timeout')) {
          errorMessage = 'Transaction confirmation timeout - please check explorer';
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      }
    },
    [wallet, account, signAndSubmitTransaction]
  );

  const reset = useCallback(() => {
    setState('idle');
    setTransactionHash(null);
    setError(null);
    setTransactionDetails(null);
    setExplorerUrl(null);
    setLastParams(null);
  }, []);

  const retry = useCallback(async () => {
    if (lastParams) {
      await submit(lastParams);
    }
  }, [lastParams, submit]);

  return {
    submit,
    state,
    transactionHash,
    error,
    transactionDetails,
    explorerUrl,
    reset,
    retry,
  };
}
