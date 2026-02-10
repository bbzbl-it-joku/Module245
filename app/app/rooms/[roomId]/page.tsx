"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RoomChatPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId as Id<"rooms">;
  const [message, setMessage] = useState("");

  const rooms = useQuery(api.rooms.getRooms, {});
  const memberships = useQuery(api.memberships.getMyMemberships, {});
  const messagesResult = useQuery(api.messages.getMessages, { roomId });

  const joinRoom = useMutation(api.memberships.joinRoom);
  const leaveRoom = useMutation(api.memberships.leaveRoom);
  const sendMessage = useMutation(api.messages.sendMessage);

  const joinedRoomIds = useMemo(
    () => new Set(memberships ?? []),
    [memberships],
  );
  const activeRoom = useMemo(
    () => rooms?.find((room) => room._id === roomId) ?? null,
    [rooms, roomId],
  );

  const isMember = Boolean(
    messagesResult?.isMember ?? joinedRoomIds.has(roomId),
  );
  const messages = messagesResult?.messages ?? [];

  if (!rooms) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600" />
        <span className="text-sm">Loading room...</span>
      </div>
    );
  }

  if (!activeRoom) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
        <h1 className="text-xl font-semibold text-slate-900">Room not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The room you are looking for does not exist or is no longer available.
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/app"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
          >
            Back to rooms
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {activeRoom.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {activeRoom.subject}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {messages.length} messages
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-3 py-1 text-xs font-semibold"
            onClick={() => {
              if (isMember) {
                void leaveRoom({ roomId });
              } else {
                void joinRoom({ roomId });
              }
            }}
          >
            {isMember ? "Leave" : "Join"}
          </Button>
        </div>
      </div>

      <div className="flex min-h-130 flex-col gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
        <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white/80 p-4">
          {isMember ? (
            messages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((item) => (
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
          )}
        </div>

        <form
          className="flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!message.trim() || !isMember) {
              return;
            }
            void sendMessage({
              roomId,
              content: message.trim(),
            }).then(() => setMessage(""));
          }}
        >
          <Input
            className="min-w-55 flex-1"
            type="text"
            placeholder={
              isMember ? "Write a message" : "Join to send messages"
            }
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={!isMember}
          />
          <Button
            variant="emerald"
            className="rounded-2xl px-5 py-2 text-sm"
            type="submit"
            disabled={!isMember}
          >
            Send
          </Button>
        </form>
        {!isMember && (
          <p className="text-xs text-slate-500">
            You must join the room before sending messages.
          </p>
        )}
      </div>
    </div>
  );
}
