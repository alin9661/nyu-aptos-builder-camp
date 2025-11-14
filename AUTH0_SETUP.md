# Auth0 Integration Setup Guide

This guide walks you through setting up Auth0 for Google Sign-In in the NYU Aptos application.

## Prerequisites

- An Auth0 account (sign up at https://auth0.com if you don't have one)
- Access to the Auth0 Dashboard

## Step 1: Create an Auth0 Application

1. Log in to your Auth0 Dashboard (https://manage.auth0.com)
2. Navigate to **Applications** > **Applications** in the sidebar
3. Click **Create Application**
4. Enter a name for your application (e.g., "NYU Aptos Governance Platform")
5. Select **Regular Web Applications** as the application type
6. Click **Create**

## Step 2: Configure Application Settings

After creating your application, you'll be taken to the application settings page. Configure the following:

### Application URIs

In the **Settings** tab, scroll down to **Application URIs** and enter:

- **Allowed Callback URLs**:
  ```
  http://localhost:3000/auth/callback
  ```
  (Add production URLs when deploying, e.g., `https://yourdomain.com/auth/callback`)

- **Allowed Logout URLs**:
  ```
  http://localhost:3000
  ```
  (Add production URLs when deploying, e.g., `https://yourdomain.com`)

- **Allowed Web Origins**:
  ```
  http://localhost:3000
  ```
  (Add production URLs when deploying, e.g., `https://yourdomain.com`)

### Important Settings to Copy

From the **Basic Information** section, copy the following values:

- **Domain** (e.g., `your-domain.auth0.com`)
- **Client ID** (a long alphanumeric string)
- **Client Secret** (click "Show" to reveal, then copy)

## Step 3: Enable Google Social Connection

1. In the Auth0 Dashboard, navigate to **Authentication** > **Social** in the sidebar
2. Find **Google** in the list of social providers
3. Click on the **Google** card
4. Toggle the switch to **Enable** the Google connection
5. You have two options:

   **Option A: Use Auth0 Dev Keys (Quick Start - Development Only)**
   - Keep "Use Auth0's Developer Keys" enabled
   - This uses Auth0's built-in Google credentials
   - **Note**: This is for development only and has limitations

   **Option B: Use Your Own Google OAuth Credentials (Recommended for Production)**
   - Disable "Use Auth0's Developer Keys"
   - Follow the instructions to create a Google OAuth 2.0 Client ID:
     1. Go to [Google Cloud Console](https://console.cloud.google.com)
     2. Create a new project or select an existing one
     3. Enable the Google+ API
     4. Create OAuth 2.0 credentials
     5. Add authorized redirect URIs: `https://your-domain.auth0.com/login/callback`
     6. Copy the Client ID and Client Secret to Auth0
6. In the **Applications** tab, enable your application
7. Click **Save Changes**

## Step 4: Configure Environment Variables

1. Open the file: `frontend/.env.local`
2. Generate an AUTH0_SECRET:
   ```bash
   openssl rand -hex 32
   ```
3. Update the Auth0 environment variables with your values:

```env
# Auth0 Configuration
AUTH0_SECRET=your_generated_32_character_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id_from_step_2
AUTH0_CLIENT_SECRET=your_client_secret_from_step_2
```

Replace:
- `your_generated_32_character_secret` with the output from the openssl command
- `your-domain` with your Auth0 domain
- `your_client_id_from_step_2` with your Client ID
- `your_client_secret_from_step_2` with your Client Secret

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to http://localhost:3000/auth in your browser

3. Click **Sign in with Google**

4. You should be redirected to Auth0's login page with a Google sign-in button

5. Sign in with your Google account

6. After successful authentication, you should be redirected back to your application

## Troubleshooting

### "Callback URL mismatch" error
- Ensure the callback URL in your Auth0 Application settings matches exactly: `http://localhost:3000/auth/callback`
- Check that there are no trailing slashes

### "Invalid state" error
- Clear your browser cookies and cache
- Make sure AUTH0_SECRET is set and is at least 32 characters long

### Google login button not appearing
- Verify that the Google Social Connection is enabled in Auth0
- Make sure your application is enabled in the Google connection's Applications tab

### "Missing required environment variable" error
- Double-check all environment variables in `.env.local` are set correctly
- Restart your development server after changing environment variables

## Additional Configuration

### Customizing the Login Page

You can customize the Auth0 Universal Login page:
1. Go to **Branding** > **Universal Login** in the Auth0 Dashboard
2. Customize colors, logos, and styling
3. Save your changes

### Adding User Roles and Permissions

1. Navigate to **User Management** > **Roles** in the Auth0 Dashboard
2. Create roles (e.g., "Admin", "Member")
3. Assign permissions to roles
4. Assign roles to users in **User Management** > **Users**

### Production Deployment

When deploying to production:

1. Update the environment variables:
   ```env
   AUTH0_BASE_URL=https://yourdomain.com
   ```

2. Add production URLs to Auth0 Application settings:
   - Allowed Callback URLs: `https://yourdomain.com/auth/callback`
   - Allowed Logout URLs: `https://yourdomain.com`
   - Allowed Web Origins: `https://yourdomain.com`

3. Set up your own Google OAuth credentials (don't use Auth0 dev keys in production)

4. Generate a new, secure AUTH0_SECRET for production

## Security Best Practices

1. **Never commit `.env.local` to version control**
2. Use different Auth0 applications for development and production
3. Rotate your AUTH0_SECRET regularly
4. Enable Multi-Factor Authentication (MFA) in Auth0
5. Monitor authentication logs in the Auth0 Dashboard
6. Set up rate limiting and bot detection

## Resources

- [Auth0 Next.js SDK Documentation](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Auth0 Dashboard](https://manage.auth0.com)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)

## Support

If you encounter issues:
1. Check the [Auth0 Community](https://community.auth0.com)
2. Review [Auth0 Documentation](https://auth0.com/docs)
3. Contact the development team
