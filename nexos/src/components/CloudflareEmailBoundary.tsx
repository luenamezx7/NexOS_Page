import type { ReactNode } from 'react';

/** Cloudflare's documented opt-out keeps React markup and mailto links intact under nonce CSP. */
export function CloudflareEmailBoundary({ children }: { children: ReactNode }) {
  return (
    <>
      <span hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: '<!--email_off-->' }} />
      {children}
      <span hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: '<!--/email_off-->' }} />
    </>
  );
}
