import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Allow public access to home and auth pages
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)"],
  // Protect all other routes
  ignoredRoutes: [],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

