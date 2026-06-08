import AppShell from '@/components/AppShell';
import { requireSession } from '@/lib/auth/dal';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <AppShell user={{ email: session.email, role: session.role }}>{children}</AppShell>;
}
