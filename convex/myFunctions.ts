import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireUser(ctx: MutationCtx): Promise<{ _id: any; email?: string } > {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const user = await ctx.db.get("users", userId);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export const getRooms = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rooms = await ctx.db.query("rooms").order("desc").take(100);
    const search = args.search?.trim().toLowerCase();
    const filtered = search
      ? rooms.filter((room) =>
          `${room.name} ${room.subject}`.toLowerCase().includes(search),
        )
      : rooms;
    return filtered.map((room) => ({
      _id: room._id,
      name: room.name,
      subject: room.subject,
      createdAt: room.createdAt,
      createdBy: room.createdBy,
    }));
  },
});

export const getMessages = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(100);
    const ordered = messages.reverse();
    const uniqueUserIds = Array.from(
      new Set(ordered.map((message) => message.userId)),
    ) as Id<"users">[];
    const userMap = new Map<Id<"users">, Doc<"users"> | null>();
    for (const userId of uniqueUserIds) {
      const user = await ctx.db.get("users", userId);
      userMap.set(userId, user);
    }
    return ordered.map((message) => ({
      _id: message._id,
      content: message.content,
      timestamp: message.timestamp,
      userId: message.userId,
      author: userMap.get(message.userId)?.email ?? "Unknown",
    }));
  },
});

export const createRoom = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    return await ctx.db.insert("rooms", {
      name: args.name.trim(),
      subject: args.subject.trim(),
      createdBy: user._id,
      createdAt: now,
    });
  },
});

export const sendMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const room = await ctx.db.get("rooms", args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    const message = args.content.trim();
    if (!message) {
      throw new Error("Message is empty");
    }
    return await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      content: message,
      timestamp: Date.now(),
    });
  },
});
