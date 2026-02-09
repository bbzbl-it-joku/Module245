import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./lib/requireUser";

async function getMembership(
  ctx: { db: { query: any } },
  roomId: Id<"rooms">,
  userId: Id<"users">,
) {
  return await ctx.db
    .query("memberships")
    .withIndex("by_roomId_userId", (q: any) =>
      q.eq("roomId", roomId).eq("userId", userId),
    )
    .unique();
}

export const getMessages = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { isMember: false, messages: [] };
    }
    const membership = await getMembership(ctx, args.roomId, userId);
    if (!membership) {
      return { isMember: false, messages: [] };
    }
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
      const author = await ctx.db.get("users", userId);
      userMap.set(userId, author);
    }
    return {
      isMember: true,
      messages: ordered.map((message) => ({
        _id: message._id,
        content: message.content,
        timestamp: message.timestamp,
        userId: message.userId,
        author: userMap.get(message.userId)?.email ?? "Unknown",
      })),
    };
  },
});

export const sendMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const membership = await getMembership(ctx, args.roomId, user._id);
    if (!membership) {
      throw new Error("Forbidden");
    }
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
