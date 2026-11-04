import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Técnica — ezway',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
