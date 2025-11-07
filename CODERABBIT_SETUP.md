# CodeRabbit Integration Setup Guide

This guide will help you complete the CodeRabbit integration for your NYU Aptos Builder Camp project.

## Overview

CodeRabbit is now configured for your project with specialized review rules for:
- **Aptos Move Smart Contracts**: Security-focused reviews for governance and treasury modules
- **Next.js Frontend**: TypeScript, React, and accessibility best practices
- **Test Files**: Comprehensive test coverage validation
- **Documentation**: Clarity and accuracy checks

## Setup Steps

### 1. Install CodeRabbit GitHub App

1. Visit the [CodeRabbit GitHub App installation page](https://github.com/apps/coderabbitai)
2. Click **"Install"** or **"Configure"** if already installed
3. Select your organization or personal account: `alin9661`
4. Choose repository access:
   - **Recommended**: Select "Only select repositories"
   - Choose: `nyu-aptos-builder-camp`
5. Click **"Install"** or **"Save"** to complete

### 2. Verify Configuration File

A `.coderabbit.yaml` configuration file has been created in your repository root with:

- **Security-focused reviews** for Move smart contracts
- **Path-specific instructions** for different file types
- **Automated review triggers** on pull requests to `main`
- **Exclusions** for build artifacts and dependencies
- **Integration** with ESLint and other linters

### 3. Commit and Push Configuration

```bash
# Add the configuration file
git add .coderabbit.yaml CODERABBIT_SETUP.md

# Commit with a descriptive message
git commit -m "Add CodeRabbit configuration for AI code reviews"

# Push to your main branch
git push origin main
```

### 4. Test the Integration

Create a test pull request to verify CodeRabbit is working:

```bash
# Create a new branch
git checkout -b test/coderabbit-integration

# Make a small change (e.g., update README)
echo "\n## Code Review" >> README.md
echo "This project uses CodeRabbit for automated AI code reviews." >> README.md

# Commit and push
git add README.md
git commit -m "Test CodeRabbit integration"
git push origin test/coderabbit-integration
```

Then create a PR on GitHub and watch for CodeRabbit's review!

## Features Enabled

### Automatic Reviews
- ✅ Pull request summaries and walkthroughs
- ✅ File-by-file change analysis
- ✅ Security vulnerability detection
- ✅ Best practices enforcement
- ✅ Test coverage suggestions

### Smart Contract Reviews
CodeRabbit will specifically check your Move contracts for:
- Access control and permission checks
- Reentrancy safety
- Integer overflow/underflow
- Balance verification before transfers
- Proper event emissions
- Error handling completeness
- Gas optimization opportunities

### Frontend Reviews
For your Next.js application, CodeRabbit will verify:
- TypeScript type safety
- React hooks best practices
- Accessibility (ARIA labels, semantic HTML)
- Performance optimizations
- Input validation and XSS prevention
- Proper error boundaries

## Using CodeRabbit

### In Pull Requests

Once integrated, CodeRabbit will automatically:
1. **Post a summary** of changes on new PRs
2. **Provide inline comments** on specific code issues
3. **Generate walkthroughs** explaining the changes
4. **Create diagrams** showing architectural impact

### Interactive Commands

You can interact with CodeRabbit using comments on your PRs:

```
@coderabbitai summary
# Get a summary of the PR

@coderabbitai review
# Request a full review

@coderabbitai help
# Get list of available commands

@coderabbitai configuration
# Export current configuration
```

### Ask Questions

```
@coderabbitai Can you explain how this affects the treasury module?

@coderabbitai What are the security implications of this change?

@coderabbitai Suggest improvements for this function
```

## VSCode Extension (Optional)

For local code reviews before creating PRs:

1. Install the [CodeRabbit VSCode extension](https://marketplace.visualstudio.com/items?itemName=CodeRabbit.coderabbit)
2. Sign in with your GitHub account
3. Review changes locally before pushing

## Configuration Customization

The `.coderabbit.yaml` file can be customized. Key sections:

### Adjust Review Intensity
```yaml
reviews:
  profile: "assertive"  # Options: chill, assertive
```

### Modify Path Filters
```yaml
reviews:
  path_filters:
    - "!**/your-custom-exclusion/**"
```

### Add Custom Instructions
```yaml
reviews:
  path_instructions:
    - path: "your/path/**/*.ext"
      instructions: |
        Your custom review instructions here
```

### Change Base Branches
```yaml
reviews:
  base_branches:
    - "main"
    - "develop"  # Add more branches as needed
```

## Pricing

For your project:
- ✅ **Public Repository**: FREE with full Pro features
- ✅ **Unlimited PR reviews**
- ✅ **Full AI-powered analysis**
- ✅ **No credit card required**

## Troubleshooting

### CodeRabbit Not Commenting on PRs

1. **Check Installation**: Verify CodeRabbit is installed on your repository
2. **Check Branch**: Ensure PR targets `main` branch (configured in `.coderabbit.yaml`)
3. **Check Draft Status**: Draft PRs are enabled in config, but verify settings
4. **Force Trigger**: Add a comment `@coderabbitai review` to manually trigger

### Configuration Not Taking Effect

1. **File Location**: Ensure `.coderabbit.yaml` is in repository root
2. **File Name**: Must be exactly `.coderabbit.yaml` (with dot prefix)
3. **Branch**: Configuration must be in the feature branch, not just main
4. **Syntax**: Validate YAML syntax (no tabs, proper indentation)

### Modify Review Behavior

Use the web interface at [coderabbit.ai](https://coderabbit.ai) to:
- Adjust global settings
- View review history
- Manage multiple repositories
- Access learning dashboard

## Support and Documentation

- **Official Docs**: [docs.coderabbit.ai](https://docs.coderabbit.ai)
- **Community**: [GitHub Discussions](https://github.com/coderabbitai/discussions)
- **Examples**: [Example Configurations](https://docs.coderabbit.ai/guides/examples)

## Security and Privacy

CodeRabbit:
- ✅ **SOC 2 Compliant**
- ✅ **GDPR Compliant**
- ✅ **Zero Data Retention** (ephemeral processing)
- ✅ **No Training on Your Code**
- ✅ **Enterprise Options Available**

## Next Steps

1. ✅ Configuration file created
2. ⬜ Install GitHub App
3. ⬜ Commit and push configuration
4. ⬜ Create test PR
5. ⬜ Review CodeRabbit's feedback
6. ⬜ Iterate and improve

## Tips for Best Results

### For Smart Contract PRs
- Include detailed PR descriptions explaining security considerations
- Reference relevant test files
- Mention any breaking changes
- Tag security-related changes appropriately

### For Frontend PRs
- Include screenshots for UI changes
- Document accessibility considerations
- Note performance impacts
- Reference design decisions

### General
- Keep PRs focused and manageable in size
- Write clear commit messages
- Respond to CodeRabbit's suggestions
- Use `@coderabbitai` commands for clarification

---

**Questions?** Comment `@coderabbitai help` on any PR or check the [documentation](https://docs.coderabbit.ai).
