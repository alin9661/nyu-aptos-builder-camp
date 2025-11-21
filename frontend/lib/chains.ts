/**
 * Shared chain metadata used by Plan A of the cross-chain roadmap.
 * Only Aptos is available right now, but the types are ready for
 * Ethereum/Polygon or any other networks we plug in later.
 */
export type ChainId = 'aptos';

export interface ChainMetadata {
  id: ChainId;
  displayName: string;
  nativeTokenSymbol: string;
  /**
   * Optional icon/asset URL if the UI needs to render a logo.
   */
  iconUrl?: string;
  /**
   * Optional explorer URL prefix for transaction deep-links.
   */
  explorerBaseUrl?: string;
}

export const CHAINS: Record<ChainId, ChainMetadata> = {
  aptos: {
    id: 'aptos',
    displayName: 'Aptos',
    nativeTokenSymbol: 'APT',
    explorerBaseUrl: 'https://explorer.aptoslabs.com',
  },
};

export const DEFAULT_CHAIN_ID: ChainId = 'aptos';

export const SUPPORTED_CHAIN_IDS: ChainId[] = Object.keys(CHAINS) as ChainId[];

export function getChainMetadata(chainId: ChainId): ChainMetadata {
  return CHAINS[chainId];
}

