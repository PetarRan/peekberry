import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: ['/', '/sign-in(.*)', '/sign-up(.*)', '/api/webhooks/(.*)'],
  // Routes that are ignored by the middleware
  ignoredRoutes: [
    '/api/webhooks/(.*)',
    '/_next/(.*)',
    '/favicon.ico',
    '/public/(.*)',
  ],
  // After sign in, redirect to dashboard
  afterAuth(auth, req) {
    // If user is signed in and trying to access sign-in/sign-up, redirect to dashboard
    if (
      auth.userId &&
      (req.nextUrl.pathname === '/sign-in' ||
        req.nextUrl.pathname === '/sign-up')
    ) {
      return Response.redirect(new URL('/dashboard', req.url));
    }

    // If user is not signed in and trying to access protected routes, redirect to sign-in
    if (!auth.userId && req.nextUrl.pathname.startsWith('/dashboard')) {
      return Response.redirect(new URL('/sign-in', req.url));
    }
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
