"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const isAdmin = useQuery(api.admin.isAdmin, {});
  const canLoad = isAdmin === true;
  const users = useQuery(api.admin.listUsers, canLoad ? {} : "skip");
  const rooms = useQuery(api.admin.listRooms, canLoad ? {} : "skip");
  const setAdminStatus = useMutation(api.admin.setAdminStatus);
  const deleteUser = useMutation(api.admin.deleteUser);
  const deleteRoom = useMutation(api.admin.deleteRoom);

  if (isAdmin === undefined) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600" />
        <span className="text-sm">Loading admin tools...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
        <h1 className="text-xl font-semibold text-slate-900">
          Admin access required
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You do not have permission to access this panel.
        </p>
        <Link
          href="/app"
          className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to rooms
        </Link>
      </section>
    );
  }

  if (!users || !rooms) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600" />
        <span className="text-sm">Loading admin data...</span>
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
              Admin portal
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage users and rooms.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Users</h2>
          <span className="text-xs text-slate-500">{users.length} total</span>
        </div>
        <div className="mt-4 flex max-h-80 flex-col gap-2 overflow-auto">
          {users.length === 0 ? (
            <div className="text-sm text-slate-500">No users yet.</div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {user.email}
                    </p>
                    <p className="text-xs text-slate-500">{user._id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.isFirstAdmin ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Primary admin
                      </span>
                    ) : user.isAdmin ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Admin
                      </span>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      onClick={() =>
                        void setAdminStatus({
                          userId: user._id,
                          makeAdmin: !user.isAdmin,
                        })
                      }
                      disabled={user.isFirstAdmin}
                    >
                      {user.isAdmin ? "Demote" : "Promote"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      onClick={() => void deleteUser({ userId: user._id })}
                      disabled={user.isFirstAdmin}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Rooms</h2>
          <span className="text-xs text-slate-500">{rooms.length} total</span>
        </div>
        <div className="mt-4 flex max-h-80 flex-col gap-2 overflow-auto">
          {rooms.length === 0 ? (
            <div className="text-sm text-slate-500">No rooms yet.</div>
          ) : (
            rooms.map((room) => (
              <div
                key={room._id}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {room.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {room.subject} · {room.createdByEmail}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    onClick={() => void deleteRoom({ roomId: room._id })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
