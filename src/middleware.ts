import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isVendorRoute = request.nextUrl.pathname.startsWith('/vendor-pos');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isMachinePage = request.nextUrl.pathname.startsWith('/machine');
  
  // Public routes that don't require authentication
  const isPublicApiRoute = 
    request.nextUrl.pathname.startsWith('/api/routes/public') || 
    request.nextUrl.pathname.startsWith('/api/trips/public') || 
    request.nextUrl.pathname.startsWith('/api/seats');
    
  // Check if it's a machine API request with the public parameter
  const isMachinePublicRequest = 
    request.nextUrl.pathname.startsWith('/api/machines') && 
    request.nextUrl.searchParams.get('public') === 'true';

  // Allow admin API access for admin users
  const isAdminApiRoute = 
    request.nextUrl.pathname.startsWith('/api/reports') || 
    request.nextUrl.pathname.startsWith('/api/vendors');
  
  // Skip auth check for public routes and machine page
  if (isPublicApiRoute || isMachinePage || isMachinePublicRequest) {
    return NextResponse.next();
  }

  // Handle admin API routes
  if (isAdminApiRoute) {
    if (!isAuthenticated || token?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Handle auth routes
  if (isAuthRoute) {
    if (isAuthenticated) {
      // If user is already authenticated, redirect to appropriate dashboard
      if (token?.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (token?.role === 'VENDOR') {
        return NextResponse.redirect(new URL('/vendor-pos', request.url));
      } else {
        return NextResponse.redirect(new URL('/search', request.url));
      }
    }
    return NextResponse.next();
  }

  // Handle protected routes
  if (isAdminRoute || isVendorRoute) {
    if (!isAuthenticated) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Check role-based access
    if (isAdminRoute && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (isVendorRoute && token?.role !== 'VENDOR' && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/vendor-pos/:path*', '/api/:path*', '/machine/:path*']
}; 