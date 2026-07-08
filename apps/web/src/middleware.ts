import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];
const AUTH_OPTIONAL_PATHS = ['/peso-variavel'];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;
  const isAuthenticated = Boolean(token);
  const isPublicPath = matchesPath(pathname, PUBLIC_PATHS);
  const isAuthOptionalPath = matchesPath(pathname, AUTH_OPTIONAL_PATHS);

  if (!isAuthenticated && !isPublicPath && !isAuthOptionalPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublicPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
