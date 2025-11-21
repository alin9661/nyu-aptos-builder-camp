# Contributing to NYU Aptos Builder Camp

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/nyu-aptos-builder-camp.git
   cd nyu-aptos-builder-camp
   ```
3. **Set up the development environment**:
   ```bash
   ./scripts/setup.sh
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Application

```bash
# Start all services
./scripts/start-dev.sh

# Or manually:
# Terminal 1: PostgreSQL
cd backend && docker-compose up postgres

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && pnpm dev
```

### Making Changes

1. **Make your changes** in your feature branch
2. **Test your changes**:
   ```bash
   # Backend tests
   cd backend && npm test

   # Type checking
   npm run typecheck

   # Linting
   npm run lint
   ```
3. **Commit your changes** with clear, descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add user profile feature"
   ```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add wallet export functionality
fix: resolve Auth0 callback error
docs: update API documentation
refactor: simplify treasury service logic
test: add unit tests for wallet service
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Avoid using `any` type
- Define proper interfaces and types
- Use strict mode

### Formatting

- Run ESLint before committing:
  ```bash
  npm run lint
  ```
- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays

### File Organization

- Place React components in `frontend/components/`
- Place API routes in `backend/src/routes/`
- Place utilities in `lib/` or `utils/` directories
- Keep files focused and single-purpose

## Testing

### Writing Tests

- Write unit tests for business logic
- Write integration tests for API endpoints
- Ensure all tests pass before submitting PR

### Running Tests

```bash
# Backend
cd backend
npm test                  # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # With coverage report

# Frontend
cd frontend
pnpm test
```

## Submitting a Pull Request

1. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Describe what changes you made and why
   - Reference any related issues
   - Include screenshots for UI changes

3. **PR Description Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests added/updated
   - [ ] All tests passing
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No new warnings introduced
   ```

4. **Address review feedback** if requested

5. **Wait for approval** - Maintainers will review your PR

## Areas to Contribute

### High Priority
- Bug fixes
- Test coverage improvements
- Documentation improvements
- Performance optimizations
- Security enhancements

### New Features
- Additional wallet integrations
- Enhanced governance features
- Analytics dashboard
- Mobile responsive improvements
- Accessibility improvements

### Documentation
- Code examples
- API documentation
- User guides
- Setup guides for different platforms

## Development Guidelines

### Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Follow security best practices
- Report security vulnerabilities privately

### Database Changes

- Create migration files for schema changes
- Test migrations both up and down
- Document migration purpose
- Include rollback instructions

### Smart Contracts

- Write comprehensive tests
- Document functions clearly
- Follow Move best practices
- Test on testnet before proposing changes

## Getting Help

- **Documentation**: Check [docs/](docs/) directory
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Setup Help**: See [SETUP.md](SETUP.md)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Keep discussions focused and professional

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to NYU Aptos Builder Camp! 🚀
