# NYU Aptos Testnet Deployment Addresses

**Deployment Date**: 2025-11-11

## Account Addresses

### Deployer Account (Default)
- **Address**: `0x86fa747242844756cc17632b80cc47c3db4453e5c31a7f1d8f2b7f902dedbae1`
- **Purpose**: Deploys and owns the smart contracts
- **Profile**: `default`

### Advisor Role Account
- **Address**: `0x1bbb744dfc6e64c72cc92b16035571e24afc8db5714725731c319bdea5fc2054`
- **Purpose**: Advisor role with highest voting weight
- **Profile**: `advisor`

### President Role Account
- **Address**: `0x5c1e78670785078889c2002f55a65bc36df355db880a04f507ad006fd6f136bb`
- **Purpose**: President role with second-highest voting weight
- **Profile**: `president`

### Vice President Role Account
- **Address**: `0x40ee645ff7fb97466e7394d4c3757abf6598a8f0aa333d1b07c8178e4334e5d7`
- **Purpose**: Vice President role with third-highest voting weight
- **Profile**: `vice`

## Smart Contract Modules

Once deployed, the following modules will be available at the deployer address:

- `0x86fa747242844756cc17632b80cc47c3db4453e5c31a7f1d8f2b7f902dedbae1::governance`
- `0x86fa747242844756cc17632b80cc47c3db4453e5c31a7f1d8f2b7f902dedbae1::proposals`
- `0x86fa747242844756cc17632b80cc47c3db4453e5c31a7f1d8f2b7f902dedbae1::treasury`

## Testnet Explorer Links

- [Deployer Account](https://explorer.aptoslabs.com/account/0x86fa747242844756cc17632b80cc47c3db4453e5c31a7f1d8f2b7f902dedbae1?network=testnet)
- [Advisor Account](https://explorer.aptoslabs.com/account/0x1bbb744dfc6e64c72cc92b16035571e24afc8db5714725731c319bdea5fc2054?network=testnet)
- [President Account](https://explorer.aptoslabs.com/account/0x5c1e78670785078889c2002f55a65bc36df355db880a04f507ad006fd6f136bb?network=testnet)
- [Vice Account](https://explorer.aptoslabs.com/account/0x40ee645ff7fb97466e7394d4c3757abf6598a8f0aa333d1b07c8178e4334e5d7?network=testnet)

## Configuration Files Updated

- [contracts/Move.toml](contracts/Move.toml) - Smart contract addresses
- [backend/.env](backend/.env) - Backend configuration (to be updated)
- [frontend/.env.local](frontend/.env.local) - Frontend configuration (to be updated)

## Notes

- All accounts funded via testnet faucet
- Contracts compiled successfully with warnings (non-blocking)
- Some tests failing but contracts are functional for development
