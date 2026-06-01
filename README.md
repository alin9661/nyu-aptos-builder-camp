# NYU Aptos Builder Camp

A comprehensive governance and treasury management platform built on the Aptos blockchain, designed for NYU students to participate in decentralized decision-making and financial management.

## Overview

This platform provides an intuitive interface for students to:
- Participate in governance proposals and voting
- Manage treasury funds and reimbursements
- Conduct campus-wide elections
- Connect using Aptos-compatible wallets (Petra, Pontem, Martian, etc.)

## Key Features

### Authentication & Identity
- **Wallet-Based Authentication** - Connect with any AIP-62 compatible Aptos wallet
- **Multi-Wallet Support** - Petra, Pontem, Martian, Nightly, and more
- **Secure Connection** - Non-custodial wallet integration
- **Role-Based Access Control** - Manage permissions via on-chain roles

### Governance
- **Proposal System** - Create, vote on, and track governance proposals
- **Campus Elections** - Conduct secure on-chain elections
- **Role-Based Access** - Advisor, President, Vice President, and Member roles
- **Real-Time Updates** - Server-Sent Events for live updates

### Treasury Management
- **Reimbursement Submissions** - Submit and track expense reimbursements
- **Multi-Signature Approvals** - Secure approval workflow
- **Balance Tracking** - Real-time treasury balance monitoring
- **Transaction History** - Complete audit trail of all transactions
- **Receipt Management** - Vercel Blob-based document storage

### Developer Experience
- **Comprehensive API** - RESTful endpoints with full documentation
- **TypeScript** - End-to-end type safety
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
- **PostgreSQL** - Relational database (Vercel Postgres or Supabase)
- **Aptos SDK** - Blockchain integration
- **Server-Sent Events** - Real-time updates

### Blockchain
- **Aptos** - Layer 1 blockchain platform
- **Move** - Smart contract language
- **Testnet** - Development and testing network

### Infrastructure
- **Vercel** - Frontend hosting with serverless functions
- **Railway/Render** - Backend API hosting
- **Vercel Postgres** - Managed PostgreSQL database
- **Vercel Blob** - File storage
- **GitHub Actions** - CI/CD pipeline

## Quick Start

**Prerequisites:**
- Node.js 18 or higher
- pnpm 8 or higher
- PostgreSQL 15+
- Git

**Installation:**

```bash
# Clone the repository
git clone https://github.com/alin9661/nyu-aptos-builder-camp.git
cd nyu-aptos-builder-camp

# Install dependencies
pnpm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit .env files with your configuration

# Set up the database
createdb nyu_aptos_dev
psql -d nyu_aptos_dev -f backend/database/schema.sql

# Start development servers (frontend and backend)
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

For detailed setup instructions, see [docs/setup/SETUP.md](docs/setup/SETUP.md).

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

- **[Setup Guide](docs/setup/SETUP.md)** - Complete installation instructions
- **[Deployment Guide](docs/setup/VERCEL_DEPLOYMENT.md)** - Vercel and Railway deployment
- **[API Reference](docs/api/API_REFERENCE.md)** - REST API documentation
- **[Authentication Guide](docs/auth/AUTHENTICATION.md)** - Auth flow details
- **[Wallet Integration](docs/guides/WALLET_INTEGRATION.md)** - Wallet setup guide
- **[Smart Contracts](contracts/README.md)** - Move contract documentation

## Development

### Running the Application

```bash
# Start both frontend and backend
pnpm dev

# Or run separately:
pnpm dev:frontend  # Start frontend only
pnpm dev:backend   # Start backend only
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

For complete API documentation, see [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md).

## Deployment

### Production Deployment

This application is designed to deploy on modern cloud platforms:

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
cd frontend && vercel --prod
```

**Backend (Railway or Render):**
- Railway: Connect GitHub repo and deploy automatically
- Render: Connect GitHub repo and deploy from backend/ directory

**Database:**
- Option 1: Vercel Postgres (Neon-powered, integrated with Vercel)
- Option 2: Supabase (More features, separate service)

**Environment Variables:**
- Configure all production environment variables in deployment platform dashboards
- Set CORS_ORIGIN to your Vercel frontend URL
- Configure wallet adapter settings for production

For complete deployment instructions, see [docs/setup/VERCEL_DEPLOYMENT.md](docs/setup/VERCEL_DEPLOYMENT.md).

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
- **Aptos Labs** - For wallet adapter and SDKs
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
