'use client';

import React from 'react';
import { TransactionDetails } from '@/hooks/useSubmitReimbursement';

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: string;
  transactionHash: string | null;
  error: string | null;
  transactionDetails: TransactionDetails | null;
  explorerUrl: string | null;
  onRetry?: () => void;
}

export default function TransactionStatusModal({
  isOpen,
  onClose,
  state,
  transactionHash,
  error,
  transactionDetails,
  explorerUrl,
  onRetry,
}: TransactionStatusModalProps) {
  if (!isOpen) return null;

  const getStateDisplay = () => {
    switch (state) {
      case 'signing':
        return { title: 'Sign Transaction', message: 'Please sign the transaction in your wallet...', color: 'text-blue-600' };
      case 'submitted':
        return { title: 'Transaction Submitted', message: 'Transaction has been submitted to the blockchain', color: 'text-blue-600' };
      case 'confirming':
        return { title: 'Confirming', message: 'Waiting for blockchain confirmation...', color: 'text-yellow-600' };
      case 'confirmed':
        return { title: 'Confirmed', message: 'Transaction confirmed on blockchain', color: 'text-green-600' };
      case 'recording':
        return { title: 'Recording', message: 'Recording transaction in database...', color: 'text-blue-600' };
      case 'success':
        return { title: 'Success!', message: 'Reimbursement request submitted successfully', color: 'text-green-600' };
      case 'error':
        return { title: 'Error', message: error || 'Transaction failed', color: 'text-red-600' };
      default:
        return { title: 'Processing', message: 'Processing transaction...', color: 'text-gray-600' };
    }
  };

  const { title, message, color } = getStateDisplay();
  const isLoading = ['signing', 'submitted', 'confirming', 'recording'].includes(state);
  const isSuccess = state === 'success';
  const isError = state === 'error';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${color}`}>{title}</h2>
          {!isLoading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Success Icon */}
        {isSuccess && (
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Error Icon */}
        {isError && (
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        )}

        {/* Message */}
        <p className="text-gray-700 text-center mb-4">{message}</p>

        {/* Transaction Hash */}
        {transactionHash && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Transaction Hash:</p>
            <p className="text-xs font-mono text-gray-600 break-all">{transactionHash}</p>

            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
              >
                View in Explorer →
              </a>
            )}
          </div>
        )}

        {/* Transaction Details */}
        {transactionDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Transaction Details:</p>
            {transactionDetails.version && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Version:</span>
                <span className="font-mono text-gray-800">{transactionDetails.version}</span>
              </div>
            )}
            {transactionDetails.gasUsed && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gas Used:</span>
                <span className="font-mono text-gray-800">{transactionDetails.gasUsed}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Timestamp:</span>
              <span className="text-gray-800">{new Date(transactionDetails.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={transactionDetails.success ? 'text-green-600' : 'text-red-600'}>
                {transactionDetails.success ? 'Success' : 'Failed'}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {isError && onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          )}
          {!isLoading && (
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                isSuccess
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
