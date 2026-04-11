"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RoomChatPage() {
  const NEAR_BOTTOM_THRESHOLD_PX = 96;
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomId = params.roomId as Id<"rooms">;
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [membershipActionPending, setMembershipActionPending] = useState(false);
  const [membershipActionError, setMembershipActionError] = useState<
    string | null
  >(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [pauseStartCount, setPauseStartCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const initialScrollDoneRef = useRef(false);
  const lastMessageCountRef = useRef(0);

  const rooms = useQuery(api.rooms.getRooms, {});
  const memberships = useQuery(api.memberships.getMyMemberships, {});
  const messagesResult = useQuery(api.messages.getMessages, { roomId, limit: 250 });

  const joinRoom = useMutation(api.memberships.joinRoom);
  const leaveRoom = useMutation(api.memberships.leaveRoom);
  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);

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
  const isAdmin = Boolean(messagesResult?.isAdmin);
  const currentUserId = messagesResult?.currentUserId ?? null;
  const canAccess = isAdmin || isMember;
  const messages = messagesResult?.messages ?? [];
  const unreadCount = isNearBottom
    ? 0
    : Math.max(0, messages.length - pauseStartCount);
  const shouldRedirect = Boolean(
    activeRoom && memberships && messagesResult && !canAccess,
  );

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/app/rooms");
    }
  }, [router, shouldRedirect]);

  useEffect(() => {
    if (!canAccess) {
      return;
    }
    if (!initialScrollDoneRef.current) {
      scrollToBottom("auto");
      initialScrollDoneRef.current = true;
      lastMessageCountRef.current = messages.length;
      return;
    }
    const previousCount = lastMessageCountRef.current;
    if (messages.length > previousCount) {
      if (isNearBottom) {
        scrollToBottom("auto");
      }
    } else if (messages.length < previousCount && isNearBottom) {
      scrollToBottom("auto");
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, canAccess, isNearBottom]);

  useEffect(() => {
    initialScrollDoneRef.current = false;
    lastMessageCountRef.current = 0;
  }, [roomId]);

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

  if (shouldRedirect) {
    return null;
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
    <div className="flex h-[calc(100dvh-10.5rem)] min-h-0 flex-col gap-6">
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
              setMembershipActionError(null);
              setMembershipActionPending(true);
              if (isMember) {
                void leaveRoom({ roomId })
                  .catch((error) => {
                    setMembershipActionError(
                      error instanceof Error ? error.message : String(error),
                    );
                  })
                  .finally(() => {
                    setMembershipActionPending(false);
                  });
              } else {
                void joinRoom({ roomId })
                  .catch((error) => {
                    setMembershipActionError(
                      error instanceof Error ? error.message : String(error),
                    );
                  })
                  .finally(() => {
                    setMembershipActionPending(false);
                  });
              }
            }}
            disabled={membershipActionPending}
          >
            {membershipActionPending
              ? "Working..."
              : isMember
                ? "Leave"
                : "Join"}
          </Button>
        </div>
      </div>
      {membershipActionError && (
        <p className="text-xs font-medium text-rose-700" role="alert">
          {membershipActionError}
        </p>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5">
        <div
          ref={messagesContainerRef}
          onScroll={(event) => {
            const container = event.currentTarget;
            const distanceToBottom =
              container.scrollHeight - container.scrollTop - container.clientHeight;
            const nearBottom = distanceToBottom <= NEAR_BOTTOM_THRESHOLD_PX;
            if (nearBottom) {
              if (!isNearBottom) {
                setIsNearBottom(true);
                setPauseStartCount(messages.length);
              }
            } else if (isNearBottom) {
              setIsNearBottom(false);
              setPauseStartCount(messages.length);
            }
          }}
          className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/80 p-4"
        >
          {canAccess ? (
            !messagesResult ? (
              <p className="text-sm text-slate-500">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((item) => {
                  const canDelete =
                    isAdmin || (currentUserId && item.userId === currentUserId);
                  return (
                    <div
                      key={item._id}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700">
                          {item.author}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() =>
                                void deleteMessage({ messageId: item._id })
                              }
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">
                        {item.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <p className="text-sm text-slate-500">
              Join this room to see messages.
            </p>
          )}
        </div>
        {canAccess && unreadCount > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-6">
            <Button
              variant="slate"
              size="sm"
              className="pointer-events-auto rounded-full px-4 py-2 text-xs font-semibold shadow-lg shadow-slate-900/15"
              onClick={() => {
                scrollToBottom("smooth");
                setIsNearBottom(true);
                setPauseStartCount(messages.length);
              }}
            >
              Jump to latest ({unreadCount})
            </Button>
          </div>
        )}

        <form
          className="flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setSendError(null);
            const draft = message.trim();
            if (!draft || !isMember || isSending) {
              return;
            }
            setIsSending(true);
            void sendMessage({
              roomId,
              content: draft,
            })
              .then(() => setMessage(""))
              .catch((error) => {
                setSendError(error instanceof Error ? error.message : String(error));
              })
              .finally(() => setIsSending(false));
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
            disabled={!isMember || isSending}
          />
          <Button
            variant="emerald"
            className="rounded-2xl px-5 py-2 text-sm"
            type="submit"
            disabled={!isMember || isSending}
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
        </form>
        {!isMember && (
          <p className="text-xs text-slate-500">
            You must join the room before sending messages.
          </p>
        )}
        {sendError && (
          <p className="text-xs font-medium text-rose-700" role="alert">
            {sendError}
          </p>
        )}
      </div>
    </div>
  );
}
