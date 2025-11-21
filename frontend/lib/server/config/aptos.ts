/**
 * Aptos blockchain configuration for server-side operations
 */

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const NETWORK = (process.env.APTOS_NETWORK || 'testnet') as Network;
const NODE_URL = process.env.APTOS_NODE_URL;
const INDEXER_URL = process.env.APTOS_INDEXER_URL;

const config = new AptosConfig({
  network: NETWORK,
  ...(NODE_URL && { fullnode: NODE_URL }),
  ...(INDEXER_URL && { indexer: INDEXER_URL }),
});

export const aptos = new Aptos(config);

export const MODULE_ADDRESS = process.env.MODULE_ADDRESS || process.env.NEXT_PUBLIC_MODULE_ADDRESS || '0x1';
export const ADVISOR_ADDRESS = process.env.ADVISOR_ADDRESS || '0x2';
export const PRESIDENT_ADDRESS = process.env.PRESIDENT_ADDRESS || '0x3';
export const VICE_ADDRESS = process.env.VICE_ADDRESS || '0x4';

export const MODULES = {
  GOVERNANCE: `${MODULE_ADDRESS}::governance`,
  TREASURY: `${MODULE_ADDRESS}::treasury`,
  PROPOSALS: `${MODULE_ADDRESS}::proposals`,
} as const;

export const COIN_TYPE = process.env.COIN_TYPE || '0x1::aptos_coin::AptosCoin';
