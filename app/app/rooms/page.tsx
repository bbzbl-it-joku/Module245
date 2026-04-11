"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RoomsBrowsePage() {
  const [search, setSearch] = useState("");
  const [actionRoomId, setActionRoomId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const rooms = useQuery(api.rooms.getRooms, { search });
  const memberships = useQuery(api.memberships.getMyMemberships, {});

  const joinRoom = useMutation(api.memberships.joinRoom);
  const leaveRoom = useMutation(api.memberships.leaveRoom);

  const joinedRoomIds = useMemo(
    () => new Set(memberships ?? []),
    [memberships],
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
            <Link
              href="/app"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
            >
              Back to rooms
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              All rooms
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse every room and join the ones you need.
            </p>
          </div>
          <Link
            href="/app/rooms/new"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
          >
            Create room
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Browse rooms
          </h2>
          <span className="text-xs text-slate-500">{rooms.length} total</span>
        </div>
        <Input
          className="mt-3"
          type="text"
          placeholder="Search rooms"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {actionError && (
          <p className="mt-3 text-xs font-medium text-rose-700" role="alert">
            {actionError}
          </p>
        )}
        <div className="mt-4 flex max-h-130 flex-col gap-2 overflow-auto">
          {rooms.length === 0 ? (
            <div className="text-sm text-slate-500">No rooms yet.</div>
          ) : (
            rooms.map((room) => {
              const joined = joinedRoomIds.has(room._id);
              return (
                <div
                  key={room._id}
                  className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 transition hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/app/rooms/${room._id}`}
                        className="text-sm font-semibold text-slate-900 transition hover:text-slate-700"
                      >
                        {room.name}
                      </Link>
                      <p className="text-xs text-slate-500">{room.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {room.memberCount} members
                      </span>
                      {joined && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Joined
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        onClick={() => {
                          setActionError(null);
                          setActionRoomId(room._id);
                          const action = joined
                            ? leaveRoom({ roomId: room._id })
                            : joinRoom({ roomId: room._id });
                          void action
                            .catch((error) => {
                              setActionError(
                                error instanceof Error ? error.message : String(error),
                              );
                            })
                            .finally(() => {
                              setActionRoomId((current) =>
                                current === room._id ? null : current,
                              );
                            });
                        }}
                        disabled={actionRoomId === room._id}
                      >
                        {actionRoomId === room._id
                          ? "Working..."
                          : joined
                            ? "Leave"
                            : "Join"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
