import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./lib/requireUser";

async function getMembership(
  ctx: { db: QueryCtx["db"] },
  roomId: Id<"rooms">,
  userId: Id<"users">,
) {
  return await ctx.db
    .query("memberships")
    .withIndex("by_roomId_userId", (q) =>
      q.eq("roomId", roomId).eq("userId", userId),
    )
    .unique();
}

async function isAdminUser(ctx: { db: QueryCtx["db"] }, userId: Id<"users">) {
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return Boolean(admin);
}

export const getMessages = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        isMember: false,
        isAdmin: false,
        currentUserId: null,
        messages: [],
      };
    }
    const isAdmin = await isAdminUser(ctx, userId);
    const membership = await getMembership(ctx, args.roomId, userId);
    if (!membership && !isAdmin) {
      return {
        isMember: false,
        isAdmin,
        currentUserId: userId,
        messages: [],
      };
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .collect();
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
      isMember: Boolean(membership),
      isAdmin,
      currentUserId: userId,
      messages: ordered.map((message) =>
        formatMessageWithAuthor(message, userMap),
      ),
    };
  },
});

function formatMessageWithAuthor(
  message: Doc<"messages">,
  userMap: Map<Id<"users">, Doc<"users"> | null>,
) {
  return {
    _id: message._id,
    content: message.content,
    timestamp: message.timestamp,
    userId: message.userId,
    author:
      userMap.get(message.userId)?.name ??
      userMap.get(message.userId)?.email ??
      "Unknown",
  };
}

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

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const message = await ctx.db.get("messages", args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    const isAdmin = await isAdminUser(ctx, user._id);
    if (!isAdmin && message.userId !== user._id) {
      throw new Error("Forbidden");
    }
    await ctx.db.delete(args.messageId);
    return args.messageId;
  },
});
