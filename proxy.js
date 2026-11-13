// proxy.js
import { NextResponse } from 'next/server';

export function proxy(request) {
  const { nextUrl, cookies } = request;
  const token = nextUrl.searchParams.get('token');
  const hasAccess = cookies.has('site_access');

  // 1. If the URL has ?token=your_secret, set a cookie and let them in
  if (token === process.env.ADMIN_KEY) {
    const response = NextResponse.next();
    response.cookies.set('site_access', 'true', {
      httpOnly: true, // Invisible to browser JS (Safe from XSS)
      secure: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  // 2. If they have the cookie, proceed to the app
  if (hasAccess) {
    return NextResponse.next();
  }

  // 3. Otherwise, show a 404 (Security through obscurity)
  return new NextResponse(null, { status: 404 });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
