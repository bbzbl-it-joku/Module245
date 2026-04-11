"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureFirstAdmin = useMutation(api.admin.ensureFirstAdmin);
  const didEnsureAdmin = useRef(false);
  const [adminSetupError, setAdminSetupError] = useState<string | null>(null);
  const isAdmin = useQuery(
    api.admin.isAdmin,
    isAuthenticated ? {} : "skip",
  );
  const showAdminLink = isAdmin === true;

  useEffect(() => {
    if (!isAuthenticated || didEnsureAdmin.current) {
      return;
    }
    didEnsureAdmin.current = true;
    void ensureFirstAdmin({}).catch((error) => {
      setAdminSetupError(error instanceof Error ? error.message : String(error));
    });
  }, [ensureFirstAdmin, isAuthenticated]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-amber-50 via-slate-50 to-emerald-50 text-slate-900">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-amber-200/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-80 w-80 -translate-y-1/3 translate-x-1/4 rounded-full bg-emerald-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 -translate-x-1/2 translate-y-1/3 rounded-full bg-slate-200/50 blur-3xl"
      />

      <header className="relative z-10 border-b border-slate-200/80 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <Link
              href="/app"
              className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:text-slate-900"
            >
              StudyCorner
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {showAdminLink && (
              <Link
                href="/app/admin"
                className="text-xs font-semibold uppercase tracking-widest text-slate-700 transition hover:text-slate-900"
              >
                Admin
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        {isLoading ? (
          <LoadingState label="Loading session..." />
        ) : isAuthenticated ? (
          <>
            {adminSetupError && (
              <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-sm">
                <p className="text-sm font-semibold">Admin setup failed</p>
                <p className="text-xs text-amber-700">{adminSetupError}</p>
              </section>
            )}
            {children}
          </>
        ) : (
          <SignInRequired />
        )}
      </main>
    </div>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest"
      onClick={() => void signOut().then(() => router.push("/"))}
      disabled={!isAuthenticated}
    >
      Sign out
    </Button>
  );
}

function SignInRequired() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
      <h1 className="text-xl font-semibold text-slate-900">Sign in required</h1>
      <p className="mt-2 text-sm text-slate-600">
        Please sign in to join rooms and participate in discussions.
      </p>
      <Link
        href="/signin"
        className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Go to sign in
      </Link>
    </section>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
