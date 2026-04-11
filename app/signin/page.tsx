"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const homeHref = !isLoading && isAuthenticated ? "/app" : "/";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/app");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-amber-50 via-slate-50 to-emerald-50 text-slate-600">
        Loading dashboard...
      </div>
    );
  }

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
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
              StudyCorner
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={homeHref}
              className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
            >
              Back home
            </Link>
            {!isLoading && isAuthenticated && (
              <Link
                href="/app"
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
              >
                Open app
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 py-16">
        <section className="w-full max-w-lg">
          <div className="text-center flex flex-col items-center gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Welcome back
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Continue the StudyCorner flow.
            </h1>
            <p className="text-slate-600">
              Sign in to join rooms, follow subjects, and keep the study flow
              live.
            </p>
          </div>
          <form
            className="mt-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-xl shadow-slate-900/5"
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              const formData = new FormData(e.target as HTMLFormElement);
              formData.set("flow", flow);
              void signIn("password", formData)
                .then(() => router.push("/app"))
                .catch((error) => {
                  setError(error.message);
                  setLoading(false);
                });
            }}
          >
            <Input
              type="email"
              name="email"
              placeholder="Email"
              required
            />
            <div className="flex flex-col gap-1">
              <Input
                type="password"
                name="password"
                placeholder="Password"
                minLength={8}
                required
              />
              {flow === "signUp" && (
                <p className="text-xs text-slate-500 px-1">
                  Password must be at least 8 characters
                </p>
              )}
            </div>
            <Button
              variant="emerald"
              className="h-12 w-full rounded-2xl text-sm font-semibold"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : flow === "signIn"
                  ? "Sign in"
                  : "Create account"}
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-slate-600">
                {flow === "signIn"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </span>
              <button
                type="button"
                className="font-semibold text-slate-700 underline decoration-2 underline-offset-2 transition hover:text-slate-900 hover:no-underline"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              >
                {flow === "signIn" ? "Sign up" : "Sign in"}
              </button>
            </div>
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-700">
                  Error: {error}
                </p>
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
