import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/requireUser";

export const getMyMemberships = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return memberships.map((membership) => membership.roomId);
  },
});

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const room = await ctx.db.get("rooms", args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id),
      )
      .unique();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("memberships", {
      roomId: args.roomId,
      userId: user._id,
      joinedAt: Date.now(),
    });
  },
});

export const leaveRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id),
      )
      .unique();
    if (!membership) {
      return null;
    }
    await ctx.db.delete(membership._id);
    return membership._id;
  },
});
