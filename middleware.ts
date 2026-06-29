import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/api/(.*)',
  '/ideas(.*)',
  '/publish(.*)',
  '/settings(.*)',
])

export default clerkMiddleware((auth, req) => {
  // Skip auth protection in dev mode if DEV_AUTH_DISABLED is true
  const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
  
  if (isProtectedRoute(req) && !devAuthDisabled) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

