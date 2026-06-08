import { NextResponse, type NextRequest } from 'next/server';
import { decryptSession, COOKIE_NAME } from '@/lib/auth/session';

const PUBLIC_PATHS = new Set(['/login']);

function isPublic(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
  if (path.startsWith('/api/health')) return true;
  if (path.startsWith('/_next/')) return true;
  if (path.startsWith('/favicon')) return true;
  return false;
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (isPublic(path)) {
    // If already signed in, bounce away from /login
    if (path === '/login') {
      const session = await decryptSession(req.cookies.get(COOKIE_NAME)?.value);
      if (session) {
        const target = session.role === 'admin' ? '/loads' : '/my';
        return NextResponse.redirect(new URL(target, req.nextUrl));
      }
    }
    return NextResponse.next();
  }

  const session = await decryptSession(req.cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    const url = new URL('/login', req.nextUrl);
    return NextResponse.redirect(url);
  }

  // Trucker trying to enter admin area → bounce to /my
  if (session.role === 'trucker' && !path.startsWith('/my')) {
    return NextResponse.redirect(new URL('/my', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
};
