import LandingPage from '@/components/landing/LandingPage';

// Root page - displays landing page with Auth0 SSO disabled for now
// Session management will be handled by custom JWT auth after API migration
export default function RootPage() {
  return <LandingPage />;
}
