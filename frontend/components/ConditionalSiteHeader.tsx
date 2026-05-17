'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from './site-header';

const PUBLIC_EXACT_ROUTES = new Set(['/']);
const PUBLIC_ROUTE_PREFIXES = ['/auth'];

export function ConditionalSiteHeader() {
  const pathname = usePathname();
  if (!pathname) return null;
  if (PUBLIC_EXACT_ROUTES.has(pathname)) return null;
  if (PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;
  return <SiteHeader />;
}
