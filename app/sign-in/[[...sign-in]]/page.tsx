"use client";

import { SignIn } from "@clerk/nextjs";
const SignInAny = SignIn as any;
import { useEffect, useState } from "react";
import { getAndClearRedirectPath } from "@/lib/authRedirect";

export default function SignInPage() {
  const [redirectUrl, setRedirectUrl] = useState<string>("/ideas");

  useEffect(() => {
    // Get the redirect path that was saved before sign-in
    const savedPath = getAndClearRedirectPath();
    if (savedPath) {
      setRedirectUrl(savedPath);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignInAny
        afterSignInUrl={redirectUrl}
        signUpUrl="/sign-up"
      />
    </div>
  );
}
