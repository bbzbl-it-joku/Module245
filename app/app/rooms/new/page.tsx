"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewRoomPage() {
  const [roomName, setRoomName] = useState("");
  const [roomSubject, setRoomSubject] = useState("");
  const createRoom = useMutation(api.rooms.createRoom);
  const router = useRouter();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/app"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
          >
            Back to rooms
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Create a room
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            New rooms are created with you as a member.
          </p>
        </div>
      </div>

      <form
        className="mt-6 flex max-w-xl flex-col gap-3"
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
            router.push(`/app/rooms/${roomId as Id<"rooms">}`);
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
        <div className="flex flex-wrap gap-3">
          <Button variant="slate" className="rounded-2xl" type="submit">
            Create room
          </Button>
          <Link
            href="/app"
            className="rounded-2xl border border-slate-300 bg-white/60 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
