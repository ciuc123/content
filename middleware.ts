import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// All routes are public - no mandatory auth
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
