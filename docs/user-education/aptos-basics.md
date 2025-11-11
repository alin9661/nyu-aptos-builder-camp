# Aptos Basics

Learn the fundamentals of the Aptos blockchain and how it powers NYU Nexus.

## What is Aptos?

Aptos is a next-generation Layer 1 blockchain designed with safety, scalability, and upgradeability at its core. Built by former members of Meta's Diem project, Aptos introduces innovative features that make it one of the fastest and most reliable blockchains available today.

### Key Features

- **High Performance**: Capable of processing over 160,000 transactions per second
- **Sub-Second Finality**: Transactions are confirmed in less than 1 second
- **Move Programming Language**: Uses Move, a resource-oriented language designed for asset safety
- **Parallel Execution**: Processes multiple transactions simultaneously using Block-STM
- **Modular Architecture**: Easily upgradeable without hard forks

## What is APT Token?

APT is the native cryptocurrency of the Aptos blockchain. It serves multiple purposes within the ecosystem:

### Primary Uses

1. **Transaction Fees**: Pay for gas fees when executing transactions
2. **Staking**: Validators stake APT to secure the network
3. **Governance**: Participate in protocol governance decisions
4. **Network Security**: Economic incentive for honest validator behavior

### Token Economics

- **Total Supply**: 1 billion APT tokens at genesis
- **Distribution**: Allocated to community, investors, team, and foundation
- **Inflation**: Controlled emission schedule for validator rewards

## What are Octas?

Octas are the smallest unit of APT, similar to how:
- Bitcoin uses satoshis (1 BTC = 100,000,000 satoshis)
- Ethereum uses wei (1 ETH = 10^18 wei)

### Conversion

```
1 APT = 100,000,000 Octas (10^8)
0.01 APT = 1,000,000 Octas
0.00000001 APT = 1 Octa
```

Octas allow for:
- Precise calculations without floating-point errors
- Microtransactions
- Accurate gas fee calculations

## How Transactions Work

Understanding the transaction lifecycle helps you use the blockchain effectively.

### Transaction Flow

1. **Initiation**: You create a transaction through NYU Nexus (e.g., vote on a proposal)
2. **Signing**: Your transaction is signed with your encrypted private key
3. **Broadcasting**: The signed transaction is sent to the Aptos network
4. **Validation**: Validators verify the transaction's authenticity and validity
5. **Execution**: The transaction is executed and included in a block
6. **Finalization**: The block is finalized and the transaction is immutable
7. **Confirmation**: You receive confirmation (typically within 1 second)

### Transaction Components

Every transaction includes:
- **Sender Address**: Your wallet address
- **Sequence Number**: Transaction counter for your account
- **Payload**: The action to perform (e.g., vote, transfer tokens)
- **Gas Parameters**: Maximum gas amount and gas price
- **Expiration Time**: When the transaction becomes invalid
- **Signature**: Cryptographic proof you authorized the transaction

### Transaction States

- **Pending**: Submitted to network, waiting for processing
- **Executing**: Being processed by validators
- **Success**: Completed successfully and included in a block
- **Failed**: Execution failed (e.g., insufficient gas, invalid operation)

## Gas Fees Explained

Gas fees are essential for blockchain operation and network security.

### What is Gas?

Gas is a unit of computational work required to execute transactions or smart contracts. Every operation on the blockchain consumes gas:

- Simple token transfer: ~5-10 gas units
- Smart contract interaction: 10-1000+ gas units (depends on complexity)
- Complex operations: Can consume more gas

### Gas Fee Calculation

```
Transaction Fee = Gas Used × Gas Price
```

For example:
- Gas Used: 8 units
- Gas Price: 100 Octas per unit
- **Total Fee: 800 Octas (0.000008 APT)**

### Why Gas Fees Exist

1. **Prevent Spam**: Makes it costly to flood the network with transactions
2. **Compensate Validators**: Pays for computational resources and network security
3. **Prioritize Transactions**: Higher gas prices can speed up transaction processing
4. **Resource Allocation**: Ensures fair usage of blockchain resources

### Gas Fees on Aptos

Aptos gas fees are typically very low:
- Average transaction: 0.0001 - 0.001 APT (~$0.001 - $0.01 at typical prices)
- Complex operations: May cost more but still affordable
- Testnet: Free gas from faucet for development

### Tips for Gas Optimization

1. **Batch Operations**: Combine multiple actions into one transaction when possible
2. **Off-Peak Times**: Transaction fees may be lower during low network usage
3. **Sufficient Balance**: Ensure you have enough APT to cover gas fees
4. **Monitor Gas Prices**: Some wallets show current network gas prices

## Block Explorers

Block explorers are web-based tools that let you view blockchain data.

### What Can You See?

- **Transactions**: View details of any transaction by hash
- **Accounts**: Check balances, transaction history, and resources
- **Blocks**: See all transactions included in each block
- **Smart Contracts**: Inspect contract code and interactions
- **Network Statistics**: Overall network health and performance

### Using Aptos Explorer

Visit [https://explorer.aptoslabs.com](https://explorer.aptoslabs.com)

#### Search By:
- **Transaction Hash**: View specific transaction details
- **Account Address**: See wallet balance and history
- **Block Height**: View all transactions in a specific block

#### Key Features:
- Real-time transaction monitoring
- Account resource viewer
- Move module inspector
- Network statistics dashboard
- Gas fee tracker

### Why Use Block Explorers?

1. **Transparency**: Verify all transactions are recorded correctly
2. **Tracking**: Monitor your transaction status in real-time
3. **Auditing**: Review historical transactions for accounting
4. **Learning**: Understand how others interact with smart contracts
5. **Security**: Confirm transaction details before and after execution

## Common Terms

### Account
A unique address on the blockchain that can hold tokens and interact with smart contracts.

### Validator
A node that participates in consensus and validates transactions. Validators stake APT to secure the network.

### Block
A collection of transactions that are processed and added to the blockchain together.

### Consensus
The process by which validators agree on the state of the blockchain.

### Finality
The point at which a transaction is considered irreversible and permanently recorded.

### Epoch
A time period (currently ~2 hours) after which validator sets and stakes may change.

### Move Module
A smart contract written in the Move programming language.

### Resource
A Move programming concept representing digital assets that cannot be copied or dropped accidentally.

## Learning Resources

### Official Documentation
- [Aptos Developer Docs](https://aptos.dev)
- [Move Language Guide](https://move-language.github.io/move/)
- [Aptos Whitepaper](https://aptoslabs.com/whitepaper)

### Interactive Learning
- [Aptos Learn](https://aptoslabs.com/learn)
- [Move Tutorial](https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples)

### Community
- [Aptos Discord](https://discord.gg/aptoslabs)
- [Aptos Forum](https://forum.aptoslabs.com)
- [Aptos Twitter](https://twitter.com/Aptos_Network)

## Next Steps

1. Explore your wallet on [Aptos Explorer](https://explorer.aptoslabs.com)
2. Read about [Wallet Security](./wallet-security.md)
3. Follow our [Getting Started Guide](./getting-started.md)
4. Check out the [FAQs](./faqs.md) for common questions

---

**Need Help?** Contact NYU Nexus support or visit our [support center](/support).
