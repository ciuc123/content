"use client";

import { SignIn } from "@clerk/nextjs";
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
      <SignIn
        afterSignInUrl={redirectUrl}
        signUpUrl="/sign-up"
      />
    </div>
  );
}
