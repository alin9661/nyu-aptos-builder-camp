# Database Setup Scripts

This directory contains shell scripts for managing the NYU Aptos backend database.

## Scripts Overview

### 1. setup-dev.sh - Complete Development Environment Setup

**Purpose:** First-time setup of the complete development environment

**What it does:**
- Checks if PostgreSQL is installed and running
- Creates the main database (`nyu_aptos`) if it doesn't exist
- Runs `database/schema.sql` to initialize all tables
- Creates a test database (`nyu_aptos_test`)
- Provides helpful next steps

**Usage:**
```bash
cd backend
./scripts/setup-dev.sh
```

**Features:**
- **Idempotent:** Safe to run multiple times
- **Interactive:** Asks for confirmation before recreating existing databases
- **Helpful errors:** Provides installation instructions if PostgreSQL is missing
- **Color-coded output:** Easy to see success/warning/error messages
- **Environment-aware:** Loads settings from `.env` file if present

**When to use:**
- First time setting up the project
- After cloning the repository
- When you need to verify your environment is set up correctly

---

### 2. init-db.sh - Database Reset/Initialization

**Purpose:** Drop and recreate the database with a fresh schema

**What it does:**
- Terminates existing database connections
- Drops the existing database
- Creates a fresh database
- Runs the schema to create all tables
- Displays table count for verification

**Usage:**
```bash
cd backend
./scripts/init-db.sh
```

**Features:**
- **Safety confirmation:** Asks for confirmation before deleting data
- **Clean slate:** Completely resets the database
- **Connection cleanup:** Terminates existing connections before dropping
- **Verification:** Shows count of created tables

**When to use:**
- When you need a clean database
- After schema changes
- When your database state is corrupted
- Before running tests that need a fresh database

**Warning:** This will DELETE all data in the database!

---

### 3. seed-db.sh - Populate Test Data

**Purpose:** Insert realistic test data for development and testing

**What it does:**
- Clears existing data from all tables
- Inserts sample users (advisor, president, VP, e-board, members)
- Adds treasury deposits (sponsors and merchandise sales)
- Creates reimbursement requests in various states
- Adds proposals (active, passed, rejected)
- Populates related data (approvals, votes, payments)
- Inserts daily analytics data

**Usage:**
```bash
cd backend
./scripts/seed-db.sh
```

**Sample Data Includes:**

**Users (12 total):**
- 1 Advisor: Dr. Sarah Chen
- 1 President: Alex Rodriguez
- 1 Vice President: Jamie Lee
- 4 E-board Members: Marcus, Priya, David, Emma
- 5 Regular Members: Chris, Sophie, Ryan, Olivia, Nathan

**Treasury Deposits (10):**
- 6 sponsor deposits totaling ~2.2B APT
- 4 merchandise sales totaling ~260M APT

**Reimbursement Requests (5):**
- 1 fully paid out
- 1 fully approved, pending payout
- 1 partially approved (2/3 approvals)
- 1 advisor approved only
- 1 newly submitted, no approvals

**Proposals (3):**
- 1 active proposal (currently open for voting)
- 1 passed and executed proposal
- 1 rejected proposal

**Features:**
- **Realistic data:** Uses actual wallet addresses and realistic amounts
- **Various states:** Shows different workflow stages
- **Relationships:** Properly links related data (approvals, votes, etc.)
- **Safe reset:** Clears existing data before inserting

**When to use:**
- After running `init-db.sh`
- When you need test data for development
- When testing the API endpoints
- When demonstrating the application

---

## Configuration

All scripts use environment variables from `.env` file or defaults:

```bash
DB_HOST=localhost       # Database host
DB_PORT=5432           # PostgreSQL port
DB_NAME=nyu_aptos      # Main database name
DB_USER=postgres       # Database user
DB_PASSWORD=postgres   # Database password
DB_TEST_NAME=nyu_aptos_test  # Test database name
```

### Setting Up .env

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Update database credentials:
   ```bash
   DB_PASSWORD=your_secure_password
   ```

---

## Common Workflows

### First Time Setup
```bash
# 1. Setup development environment
./scripts/setup-dev.sh

# 2. Seed test data
./scripts/seed-db.sh

# 3. Start the server
npm run dev
```

### Reset Database
```bash
# Drop and recreate (WARNING: deletes all data!)
./scripts/init-db.sh

# Seed fresh test data
./scripts/seed-db.sh
```

### Daily Development
```bash
# If you need fresh test data
./scripts/seed-db.sh

# Start development server
npm run dev
```

### Before Running Tests
```bash
# Reset to clean state
./scripts/init-db.sh

# Optionally seed data
./scripts/seed-db.sh

# Run tests
npm test
```

---

## Troubleshooting

### PostgreSQL Not Installed
```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### PostgreSQL Not Running
```bash
# macOS (Homebrew)
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
pg_isready -h localhost -p 5432
```

### Permission Denied
```bash
# Create PostgreSQL user (if needed)
createuser -s postgres

# Or use your system user
DB_USER=your_username ./scripts/setup-dev.sh
```

### Connection Refused
Check your `.env` file:
- Ensure `DB_HOST=localhost`
- Ensure `DB_PORT=5432`
- Ensure `DB_USER` and `DB_PASSWORD` are correct

### Schema File Not Found
Ensure you're running scripts from the `backend/` directory:
```bash
cd backend
./scripts/setup-dev.sh
```

---

## Script Features

### Color-Coded Output
- ✓ Green: Success messages
- ⚠ Yellow: Warnings
- ✗ Red: Errors
- ℹ Blue: Information

### Error Handling
- Scripts exit on first error (`set -e`)
- Helpful error messages with solutions
- Connection validation before operations
- Confirmation prompts for destructive operations

### Security
- Passwords from environment variables
- `PGPASSWORD` cleaned up after execution
- No hardcoded credentials

---

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Backend README](../README.md)
- [Database Schema](../database/schema.sql)
- [API Documentation](../API_REFERENCE.md)
