"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function RoomsLandingPage() {
  const rooms = useQuery(api.rooms.getRooms, {});
  const memberships = useQuery(api.memberships.getMyMemberships, {});

  const joinedRoomIds = useMemo(
    () => new Set(memberships ?? []),
    [memberships],
  );
  const joinedRooms = useMemo(
    () => rooms?.filter((room) => joinedRoomIds.has(room._id)) ?? [],
    [rooms, joinedRoomIds],
  );

  if (!rooms) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600" />
        <span className="text-sm">Loading rooms...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Joined rooms
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Jump into a room or browse all available spaces.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/rooms"
              className="rounded-full border border-slate-300 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition hover:border-slate-400"
            >
              All rooms
            </Link>
            <Link
              href="/app/rooms/new"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
            >
              Create room
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Your rooms
          </h2>
          <span className="text-xs text-slate-500">
            {joinedRooms.length} joined
          </span>
        </div>
        <div className="mt-4 flex max-h-105 flex-col gap-2 overflow-auto">
          {joinedRooms.length === 0 ? (
            <div className="flex flex-col gap-3 text-sm text-slate-500">
              <span>You have not joined any rooms yet.</span>
              <Link
                href="/app/rooms"
                className="inline-flex w-fit items-center rounded-full border border-slate-300 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition hover:border-slate-400"
              >
                Browse all rooms
              </Link>
            </div>
          ) : (
            joinedRooms.map((room) => (
              <Link
                key={room._id}
                href={`/app/rooms/${room._id}`}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-left transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {room.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {room.memberCount} members
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Joined
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{room.subject}</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
