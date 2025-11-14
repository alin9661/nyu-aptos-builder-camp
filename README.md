# NYU Aptos Builder Camp

A comprehensive governance and treasury management platform built on the Aptos blockchain, designed for NYU students to participate in decentralized decision-making and financial management.

## Overview

This platform provides an intuitive interface for students to:
- Participate in governance proposals and voting
- Manage treasury funds and reimbursements
- Conduct campus-wide elections
- Automatically generate Aptos wallets through NYU SSO
- Authenticate with Google via Auth0

## Key Features

### Authentication & Identity
- **NYU SSO Integration** - Seamless login with NYU NetID
- **Auth0 Support** - Google Sign-In and social authentication
- **Automatic Wallet Generation** - Ed25519 Aptos wallets created on first login
- **Dual Authentication** - Support for both SSO and traditional wallet connection
- **Secure Key Storage** - AES-256-GCM encryption for private keys

### Governance
- **Proposal System** - Create, vote on, and track governance proposals
- **Campus Elections** - Conduct secure on-chain elections
- **Role-Based Access** - Advisor, President, Vice President, and Member roles
- **Real-Time Updates** - WebSocket-powered live proposal status

### Treasury Management
- **Reimbursement Submissions** - Submit and track expense reimbursements
- **Multi-Signature Approvals** - Secure approval workflow
- **Balance Tracking** - Real-time treasury balance monitoring
- **Transaction History** - Complete audit trail of all transactions
- **Receipt Management** - IPFS-based document storage

### Developer Experience
- **Comprehensive API** - RESTful endpoints with full documentation
- **TypeScript** - End-to-end type safety
- **Docker Support** - Containerized development environment
- **Automated Testing** - CI/CD with GitHub Actions
- **Hot Reload** - Fast development feedback loop

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Aptos Wallet Adapter** - Multi-wallet support

### Backend
- **Express** - Node.js web framework
- **TypeScript** - Type-safe API development
- **PostgreSQL** - Relational database
- **Aptos SDK** - Blockchain integration
- **Socket.io** - Real-time WebSocket communication

### Blockchain
- **Aptos** - Layer 1 blockchain platform
- **Move** - Smart contract language
- **Testnet** - Development and testing network

### Infrastructure
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Kubernetes** - Production deployment (optional)

## Quick Start

### Prerequisites
- Node.js 18 or higher
- pnpm
- PostgreSQL 15+ or Docker Desktop
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/alin9661/nyu-aptos-builder-camp.git
cd nyu-aptos-builder-camp

# Run automated setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start development servers
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

For detailed setup instructions, see [SETUP.md](SETUP.md).

## Project Structure

```
nyu-aptos-builder-camp/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, logging, etc.
│   │   └── utils/          # Helper functions
│   ├── database/           # Migrations and schemas
│   └── tests/              # Backend tests
├── frontend/                # Next.js application
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and API clients
│   └── hooks/              # Custom React hooks
├── contracts/               # Aptos Move smart contracts
│   ├── sources/            # Contract source code
│   └── tests/              # Contract tests
├── docs/                    # Documentation
├── scripts/                 # Setup and utility scripts
└── .github/                 # CI/CD workflows
```

## Documentation

- **[Setup Guide](SETUP.md)** - Complete installation instructions
- **[API Reference](docs/API_REFERENCE.md)** - REST API documentation
- **[Authentication Guide](docs/AUTHENTICATION.md)** - Auth flow details
- **[Wallet Integration](docs/WALLET_INTEGRATION.md)** - Wallet setup guide
- **[Smart Contracts](contracts/README.md)** - Move contract documentation
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment guide

## Development

### Running the Application

```bash
# Start PostgreSQL (Docker)
cd backend && docker-compose up -d postgres

# Start Backend
cd backend && npm run dev

# Start Frontend
cd frontend && pnpm dev
```

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Run specific test suite
npm run test:unit
npm run test:integration

# With coverage
npm run test:coverage
```

### Database Management

```bash
# Run migrations
cd backend
psql -d nyu_aptos -U postgres -f database/migrations/001_add_auth_tables.sql

# Connect to database
psql -d nyu_aptos -U postgres

# Backup database
pg_dump nyu_aptos > backup.sql
```

### Smart Contract Development

```bash
# Compile contracts
cd contracts && aptos move compile

# Run tests
aptos move test

# Deploy to testnet
aptos move publish
```

## API Endpoints

### Authentication
- `POST /api/auth/nonce` - Get signature nonce
- `POST /api/auth/login` - Wallet-based login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Governance
- `GET /api/governance/elections` - List elections
- `POST /api/governance/vote` - Submit vote
- `GET /api/governance/results/:id` - Get election results

### Treasury
- `GET /api/treasury/balance` - Get treasury balance
- `POST /api/treasury/reimbursement` - Submit reimbursement
- `GET /api/treasury/transactions` - List transactions

### Proposals
- `GET /api/proposals` - List proposals
- `POST /api/proposals` - Create proposal
- `POST /api/proposals/:id/vote` - Vote on proposal
- `GET /api/proposals/:id` - Get proposal details

For complete API documentation, see [docs/API_REFERENCE.md](docs/API_REFERENCE.md).

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Style

- Follow existing code formatting
- Use TypeScript for type safety
- Write tests for new features
- Update documentation as needed

### Testing

- Write unit tests for business logic
- Add integration tests for API endpoints
- Test smart contracts thoroughly
- Ensure all tests pass before submitting PR

## Security

- Never commit `.env` or `.env.local` files
- Use strong, randomly generated secrets
- Report security vulnerabilities privately
- Follow secure coding practices
- Review [COMPLIANCE_GDPR_CCPA.md](docs/COMPLIANCE_GDPR_CCPA.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **NYU** - For supporting blockchain education
- **Aptos Foundation** - For blockchain infrastructure
- **Auth0** - For authentication services
- **Open Source Community** - For amazing tools and libraries

## Support

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: [GitHub Issues](https://github.com/alin9661/nyu-aptos-builder-camp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alin9661/nyu-aptos-builder-camp/discussions)

## Roadmap

- [ ] Mainnet deployment
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Multi-organization support
- [ ] NFT-based membership system
- [ ] Integration with more wallets

---

**Built with ❤️ by NYU Aptos Builder Camp Team**

For questions or support, please open an issue or reach out to the maintainers.
