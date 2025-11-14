# Auth0 Post-Login Action

This directory contains the Auth0 Post-Login Action code for automatic Aptos wallet creation.

## File

- `post-login-action.js` - Auth0 action that triggers after Google SSO login

## Quick Setup

### 1. Copy Action Code

1. Open `post-login-action.js`
2. Copy the entire contents
3. Go to Auth0 Dashboard > Actions > Library > Build Custom
4. Create new "Login / Post Login" action
5. Paste the code

### 2. Configure Secrets in Auth0

Add these secrets in the Auth0 action editor:

```
BACKEND_WEBHOOK_SECRET=<your-webhook-secret>
BACKEND_WEBHOOK_URL=https://your-api.com/api/auth/webhook/create-wallet
```

### 3. Add Dependencies

In Auth0 action editor, add:
- `axios` version `1.6.0`

### 4. Deploy

1. Click "Deploy" in Auth0 action editor
2. Go to Actions > Flows > Login
3. Drag action into the flow
4. Click "Apply"

## Testing Locally

For local development, use ngrok:

```bash
# Start ngrok
ngrok http 3001

# Use ngrok URL in Auth0 secrets:
BACKEND_WEBHOOK_URL=https://abc123.ngrok.io/api/auth/webhook/create-wallet
```

## See Also

- Full documentation: `/docs/AUTH0_WALLET_INTEGRATION.md`
- Backend webhook: `/backend/src/routes/webhook.ts`
