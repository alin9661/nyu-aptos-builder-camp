/**
 * Auth0 Post-Login Action: Automatic Aptos Wallet Creation
 *
 * This action triggers after successful Google SSO login and automatically
 * creates an Aptos wallet for the user via backend webhook.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to Auth0 Dashboard > Actions > Library
 * 2. Click "Build Custom" > "Create Action"
 * 3. Name: "Create Aptos Wallet"
 * 4. Trigger: "Login / Post Login"
 * 5. Copy this code into the action editor
 * 6. Add Secrets:
 *    - BACKEND_WEBHOOK_SECRET: Your webhook authentication secret
 *    - BACKEND_WEBHOOK_URL: https://your-backend-api.com/api/auth/webhook/create-wallet
 * 7. Deploy the action
 * 8. Add to Login Flow via Actions > Flows > Login
 */

const axios = require('axios');

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Only process Google OAuth logins
  if (event.connection !== 'google-oauth2') {
    console.log(`Skipping wallet creation - not a Google login: ${event.connection}`);
    return;
  }

  // Check if user already has a wallet
  if (event.user.app_metadata && event.user.app_metadata.aptos_wallet_address) {
    console.log(`User ${event.user.email} already has wallet: ${event.user.app_metadata.aptos_wallet_address}`);
    return;
  }

  // Validate required secrets
  if (!event.secrets.BACKEND_WEBHOOK_SECRET || !event.secrets.BACKEND_WEBHOOK_URL) {
    console.error('ERROR: Missing required secrets (BACKEND_WEBHOOK_SECRET or BACKEND_WEBHOOK_URL)');
    // Don't block login, just log the error
    return;
  }

  // Extract user information
  const userInfo = {
    auth0_id: event.user.user_id,
    email: event.user.email,
    given_name: event.user.given_name || event.user.name?.split(' ')[0] || '',
    family_name: event.user.family_name || event.user.name?.split(' ')[1] || '',
  };

  console.log(`Creating Aptos wallet for user: ${userInfo.email}`);

  // Retry configuration
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff in milliseconds

  let lastError = null;

  // Attempt to create wallet with retries
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`Wallet creation attempt ${attempt + 1}/${MAX_RETRIES} for ${userInfo.email}`);

      // Call backend webhook
      const response = await axios.post(
        event.secrets.BACKEND_WEBHOOK_URL,
        userInfo,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${event.secrets.BACKEND_WEBHOOK_SECRET}`,
            'X-Auth0-User-ID': userInfo.auth0_id,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Check response
      if (response.data && response.data.success && response.data.wallet_address) {
        const walletAddress = response.data.wallet_address;

        console.log(`Wallet created successfully for ${userInfo.email}: ${walletAddress}`);

        // Update user metadata with wallet address
        api.user.setAppMetadata('aptos_wallet_address', walletAddress);
        api.user.setAppMetadata('wallet_created_at', new Date().toISOString());
        api.user.setAppMetadata('wallet_provider', 'auto_generated');

        // Success - exit retry loop
        return;
      } else {
        throw new Error('Invalid response from webhook: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      lastError = error;

      // Log detailed error information
      if (error.response) {
        // Server responded with error status
        console.error(`Wallet creation failed (attempt ${attempt + 1}):`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          email: userInfo.email,
        });
      } else if (error.request) {
        // Request made but no response received
        console.error(`Wallet creation failed - no response (attempt ${attempt + 1}):`, {
          message: error.message,
          email: userInfo.email,
        });
      } else {
        // Error in request setup
        console.error(`Wallet creation failed - request setup error (attempt ${attempt + 1}):`, {
          message: error.message,
          email: userInfo.email,
        });
      }

      // If not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }
  }

  // All retries failed - log final error but don't block login
  console.error(`FINAL ERROR: Failed to create wallet after ${MAX_RETRIES} attempts for ${userInfo.email}:`, {
    lastError: lastError?.message,
    stack: lastError?.stack,
  });

  // Set metadata to indicate wallet creation failed
  api.user.setAppMetadata('wallet_creation_failed', true);
  api.user.setAppMetadata('wallet_creation_last_attempt', new Date().toISOString());

  // Don't throw error - allow login to proceed
  // User can retry wallet creation later through the application
};

/**
 * Handler that will be invoked when this action is resuming after an external redirect.
 * If your onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onContinuePostLogin = async (event, api) => {
  // Not used for this action
};
