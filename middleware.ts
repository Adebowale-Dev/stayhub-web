import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/forgot-password' || path.startsWith('/reset-password');

  // Protected paths
  const isAdminPath = path.startsWith('/admin');
  const isStudentPath = path.startsWith('/student');
  const isPorterPath = path.startsWith('/porter');

  // Get token from cookie or localStorage (cookies are more secure for SSR)
  // Note: In a real app, you'd use httpOnly cookies set by your API
  // For client-side auth, the actual check happens in ProtectedRoute component

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected routes, let the client-side ProtectedRoute component handle auth
  // This middleware just ensures the routes exist
  if (isAdminPath || isStudentPath || isPorterPath) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' ,
  ],
};
