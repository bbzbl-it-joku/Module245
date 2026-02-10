"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const showSignIn = !isLoading && !isAuthenticated;

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
            {showSignIn && (
              <Link
                href="/signin"
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/app"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Real-time study commons
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
              A focused space for every subject, built for live learning.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-600 md:text-lg">
              StudyCorner turns class topics into live rooms where students can
              share questions, keep momentum, and help each other without
              leaving the flow of the lesson.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {showSignIn && (
                <Link
                  href="/signin"
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:-translate-y-0.5"
                >
                  Get started
                </Link>
              )}
              <Link
                href="/app"
                className="rounded-full border border-slate-300 bg-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Explore rooms
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-xs text-slate-500">
              <span>Instant rooms</span>
              <span>Membership-based access</span>
              <span>Real-time updates</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Live preview
              </p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                New
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                { title: "Physics: Waves" },
                { title: "Math: Derivatives" },
                { title: "History: WWI" },
              ].map((room) => (
                <div
                  key={room.title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {room.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Subject lanes",
              description:
                "Keep discussion sorted by topics so every class has a clear home.",
            },
            {
              title: "Membership control",
              description:
                "Join rooms intentionally and keep the conversation focused.",
            },
            {
              title: "Live momentum",
              description:
                "Messages arrive instantly, so questions never lose their timing.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-900 px-8 py-10 text-white shadow-2xl shadow-slate-900/30">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold md:text-3xl">
                Build a shared study rhythm in minutes.
              </h2>
              <p className="mt-3 text-sm text-slate-200">
                Launch a room, invite classmates, and let everyone collaborate
                without the noise of traditional group chats.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {showSignIn && (
                <Link
                  href="/signin"
                  className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900"
                >
                  Start with your class
                </Link>
              )}
              <Link
                href="/app"
                className="rounded-full border border-white/40 px-6 py-3 text-center text-sm font-semibold text-white"
              >
                Visit the app
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
