"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { agentInboxSvg } from "@/components/agent-inbox/components/agent-inbox-logo";
import { Github, KeyRound } from "lucide-react";

type Providers = Awaited<ReturnType<typeof getProviders>>;

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  github: <Github className="w-5 h-5" />,
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  ),
};

const FALLBACK_ICON = <KeyRound className="w-5 h-5" />;

export default function SignInPage() {
  const [providers, setProviders] = useState<Providers>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProviders().then((p) => {
      setProviders(p);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
      <div className="flex flex-col items-center gap-8 rounded-2xl bg-white p-10 shadow-md w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          {agentInboxSvg}
          <p className="text-sm text-gray-500">
            Sign in to continue
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading providers...</p>
        ) : providers && Object.keys(providers).length > 0 ? (
          <div className="flex flex-col gap-3 w-full">
            {Object.values(providers).map((provider) => (
              <Button
                key={provider.id}
                variant="brand"
                size="lg"
                className="w-full gap-3 text-sm"
                onClick={() =>
                  signIn(provider.id, { callbackUrl: "/" })
                }
              >
                {PROVIDER_ICONS[provider.id] ?? FALLBACK_ICON}
                Continue with {provider.name}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-red-500 text-center">
            No authentication providers configured. Please set up at
            least one provider in your environment variables.
          </p>
        )}
      </div>
    </div>
  );
}
