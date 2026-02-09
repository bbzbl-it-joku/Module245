"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-700 flex flex-row justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h1 className="font-semibold text-slate-800 dark:text-slate-200">
            StudyCorner
          </h1>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Real-time study rooms
          </span>
        </div>
        <AuthButton />
      </header>
      <main className="p-6 md:p-10 flex flex-col gap-8">
        <Content />
      </main>
    </>
  );
}

function AuthButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  return (
    <>
      {isAuthenticated ? (
        <button
          className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          onClick={() =>
            void signOut().then(() => {
              router.push("/signin");
            })
          }
        >
          Sign out
        </button>
      ) : (
        <button
          className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-500 dark:hover:bg-slate-400 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          onClick={() => router.push("/signin")}
        >
          Sign in
        </button>
      )}
    </>
  );
}

function Content() {
  const { isAuthenticated } = useConvexAuth();
  const [search, setSearch] = useState("");
  const [activeRoomId, setActiveRoomId] = useState<Id<"rooms"> | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomSubject, setRoomSubject] = useState("");
  const [message, setMessage] = useState("");
  const rooms = useQuery(api.myFunctions.getRooms, {
    search,
  });
  const messages = useQuery(
    api.myFunctions.getMessages,
    activeRoomId ? { roomId: activeRoomId } : "skip",
  );
  const createRoom = useMutation(api.myFunctions.createRoom);
  const sendMessage = useMutation(api.myFunctions.sendMessage);

  useEffect(() => {
    if (!activeRoomId && rooms && rooms.length > 0) {
      setActiveRoomId(rooms[0]._id);
    }
  }, [activeRoomId, rooms]);

  const activeRoom = useMemo(
    () => rooms?.find((room) => room._id === activeRoomId) ?? null,
    [rooms, activeRoomId],
  );

  if (!rooms) {
    return (
      <div className="mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <p className="ml-2 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      <section className="flex flex-col gap-6">
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Create a room
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rooms are public for now. Login is required to create a room.
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
              }).then(() => {
                setRoomName("");
                setRoomSubject("");
              });
            }}
          >
            <input
              className="bg-white dark:bg-slate-900 text-foreground rounded-lg p-3 border border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none transition-all placeholder:text-slate-400"
              type="text"
              placeholder="Room name"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
            />
            <input
              className="bg-white dark:bg-slate-900 text-foreground rounded-lg p-3 border border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none transition-all placeholder:text-slate-400"
              type="text"
              placeholder="Subject"
              value={roomSubject}
              onChange={(event) => setRoomSubject(event.target.value)}
            />
            <button
              className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold rounded-lg py-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              type="submit"
              disabled={!isAuthenticated}
            >
              Create room
            </button>
          </form>
          {!isAuthenticated && (
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-3">
              Sign in to create rooms and post messages.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Rooms
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {rooms.length} total
            </span>
          </div>
          <input
            className="mt-3 w-full bg-white dark:bg-slate-900 text-foreground rounded-lg p-3 border border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none transition-all placeholder:text-slate-400"
            type="text"
            placeholder="Search rooms"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="mt-4 flex flex-col gap-2 max-h-[420px] overflow-auto">
            {rooms.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                No rooms yet. Create the first one.
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room._id}
                  className={`text-left rounded-xl border px-4 py-3 transition-all ${
                    room._id === activeRoomId
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  onClick={() => setActiveRoomId(room._id)}
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {room.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {room.subject}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col gap-4 min-h-[520px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {activeRoom?.name ?? "Pick a room"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeRoom?.subject ?? "Select a room to start chatting"}
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {messages?.length ?? 0} messages
            </span>
          </div>
          <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800">
            {activeRoomId && messages ? (
              messages.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No messages yet. Say hi.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {item.author}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose a room to load its messages.
              </p>
            )}
          </div>
          <form
            className="flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!activeRoomId || !message.trim()) {
                return;
              }
              void sendMessage({
                roomId: activeRoomId,
                content: message,
              }).then(() => setMessage(""));
            }}
          >
            <input
              className="flex-1 bg-white dark:bg-slate-900 text-foreground rounded-lg p-3 border border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none transition-all placeholder:text-slate-400"
              type="text"
              placeholder={
                activeRoomId ? "Write a message" : "Select a room first"
              }
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={!activeRoomId || !isAuthenticated}
            />
            <button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              type="submit"
              disabled={!activeRoomId || !isAuthenticated}
            >
              Send
            </button>
          </form>
          {!isAuthenticated && (
            <p className="text-xs text-amber-600 dark:text-amber-300">
              Sign in to send messages.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
