"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AppPage() {
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
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <Link
              href="/"
              className="text-base font-semibold text-slate-900 transition hover:text-slate-700"
            >
              StudyCorner
            </Link>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <AuthGate />
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

function AuthGate() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600" />
        <span className="text-sm">Loading session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
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

  return <AppContent />;
}

function AppContent() {
  const [search, setSearch] = useState("");
  const [activeRoomId, setActiveRoomId] = useState<Id<"rooms"> | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomSubject, setRoomSubject] = useState("");
  const [message, setMessage] = useState("");

  const rooms = useQuery(api.rooms.getRooms, { search });
  const memberships = useQuery(api.memberships.getMyMemberships, {});
  const messagesResult = useQuery(
    api.messages.getMessages,
    activeRoomId ? { roomId: activeRoomId } : "skip",
  );

  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.memberships.joinRoom);
  const leaveRoom = useMutation(api.memberships.leaveRoom);
  const sendMessage = useMutation(api.messages.sendMessage);

  type Room = NonNullable<typeof rooms>[number];
  type Message = (typeof messages)[number];

  useEffect(() => {
    if (!activeRoomId && rooms && rooms.length > 0) {
      setActiveRoomId(rooms[0]._id);
    }
  }, [activeRoomId, rooms]);

  const activeRoom = useMemo(
    () => rooms?.find((room: Room) => room._id === activeRoomId) ?? null,
    [rooms, activeRoomId],
  );

  const joinedRoomIds = useMemo(() => {
    return new Set(memberships ?? []);
  }, [memberships]);

  const isMember = Boolean(
    messagesResult?.isMember ?? (activeRoomId && joinedRoomIds.has(activeRoomId)),
  );
  const messages = messagesResult?.messages ?? [];

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <section className="flex flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
          <h2 className="text-base font-semibold text-slate-900">Create room</h2>
          <p className="mt-1 text-xs text-slate-500">
            New rooms are created with you as a member.
          </p>
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!roomName.trim() || !roomSubject.trim()) {
                return;
              }
              void createRoom({
                name: roomName.trim(),
                subject: roomSubject.trim(),
              }).then((roomId) => {
                setRoomName("");
                setRoomSubject("");
                setActiveRoomId(roomId as Id<"rooms">);
              });
            }}
          >
            <Input
              type="text"
              placeholder="Room name"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
            />
            <Input
              type="text"
              placeholder="Subject"
              value={roomSubject}
              onChange={(event) => setRoomSubject(event.target.value)}
            />
            <Button
              variant="slate"
              className="rounded-2xl"
              type="submit"
            >
              Create room
            </Button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Rooms</h2>
            <span className="text-xs text-slate-500">{rooms.length} total</span>
          </div>
          <Input
            className="mt-3"
            type="text"
            placeholder="Search rooms"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="mt-4 flex max-h-105 flex-col gap-2 overflow-auto">
            {rooms.length === 0 ? (
              <div className="text-sm text-slate-500">No rooms yet.</div>
            ) : (
              rooms.map((room: Room) => {
                const joined = joinedRoomIds.has(room._id);
                return (
                  <button
                    key={room._id}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      room._id === activeRoomId
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white/70 hover:border-slate-300"
                    }`}
                    onClick={() => setActiveRoomId(room._id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {room.name}
                      </p>
                      {joined && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Joined
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{room.subject}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex min-h-130 flex-col gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {activeRoom?.name ?? "Pick a room"}
              </h2>
              <p className="text-xs text-slate-500">
                {activeRoom?.subject ?? "Select a room to see messages"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {messages.length} messages
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-3 py-1 text-xs font-semibold"
                disabled={!activeRoomId}
                onClick={() => {
                  if (!activeRoomId) {
                    return;
                  }
                  if (isMember) {
                    void leaveRoom({ roomId: activeRoomId });
                  } else {
                    void joinRoom({ roomId: activeRoomId });
                  }
                }}
              >
                {isMember ? "Leave" : "Join"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white/80 p-4">
            {activeRoomId ? (
              isMember ? (
                messages.length === 0 ? (
                  <p className="text-sm text-slate-500">No messages yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((item: Message) => (
                      <div
                        key={item._id}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-700">
                            {item.author}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-sm text-slate-500">
                  Join this room to see messages.
                </p>
              )
            ) : (
              <p className="text-sm text-slate-500">
                Choose a room to load its messages.
              </p>
            )}
          </div>

          <form
            className="flex flex-wrap gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!activeRoomId || !message.trim() || !isMember) {
                return;
              }
              void sendMessage({
                roomId: activeRoomId,
                content: message.trim(),
              }).then(() => setMessage(""));
            }}
          >
            <Input
              className="min-w-55 flex-1"
              type="text"
              placeholder={
                activeRoomId
                  ? isMember
                    ? "Write a message"
                    : "Join to send messages"
                  : "Select a room first"
              }
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={!activeRoomId || !isMember}
            />
            <Button
              variant="emerald"
              className="rounded-2xl px-5 py-2 text-sm"
              type="submit"
              disabled={!activeRoomId || !isMember}
            >
              Send
            </Button>
          </form>
          {!isMember && activeRoomId && (
            <p className="text-xs text-slate-500">
              You must join the room before sending messages.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
