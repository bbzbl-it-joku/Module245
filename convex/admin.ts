import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/requireAdmin";

type DbCtx = { db: QueryCtx["db"] };

async function getAdminByUserId(ctx: DbCtx, userId: Id<"users">) {
  return await ctx.db
    .query("admins")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

async function getFirstAdmin(ctx: DbCtx) {
  const admins = await ctx.db.query("admins").collect();
  if (admins.length === 0) {
    return null;
  }
  return admins.reduce((first, admin) =>
    admin.createdAt < first.createdAt ? admin : first,
  );
}

async function deleteRoomCascade(ctx: MutationCtx, roomId: Id<"rooms">) {
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
    .collect();
  for (const membership of memberships) {
    await ctx.db.delete(membership._id);
  }
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
    .collect();
  for (const message of messages) {
    await ctx.db.delete(message._id);
  }
  await ctx.db.delete(roomId);
}

export const ensureFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get("users", userId);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const existing = await getAdminByUserId(ctx, userId);
    if (existing) {
      return true;
    }
    const anyAdmin = await ctx.db.query("admins").take(1);
    if (anyAdmin.length > 0) {
      return false;
    }
    await ctx.db.insert("admins", { userId, createdAt: Date.now() });
    return true;
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }
    const admin = await getAdminByUserId(ctx, userId);
    return Boolean(admin);
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const admins = await ctx.db.query("admins").collect();
    const firstAdmin = await getFirstAdmin(ctx);
    const firstAdminId = firstAdmin?.userId ?? null;
    const adminIds = new Set(admins.map((admin) => admin.userId));
    return users.map((user) => ({
      _id: user._id,
      email: user.email ?? "Unknown",
      createdAt: user._creationTime,
      isAdmin: adminIds.has(user._id),
      isFirstAdmin: user._id === firstAdminId,
    }));
  },
});

export const setAdminStatus = mutation({
  args: {
    userId: v.id("users"),
    makeAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    const firstAdmin = await getFirstAdmin(ctx);
    if (!args.makeAdmin && firstAdmin?.userId === args.userId) {
      throw new Error("Cannot demote the first admin");
    }
    const existing = await getAdminByUserId(ctx, args.userId);
    if (args.makeAdmin) {
      if (!existing) {
        await ctx.db.insert("admins", {
          userId: args.userId,
          createdAt: Date.now(),
        });
      }
      return true;
    }
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return false;
  },
});

export const listRooms = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rooms = await ctx.db.query("rooms").collect();
    const creatorIds = Array.from(
      new Set(rooms.map((room) => room.createdBy)),
    );
    const creatorMap = new Map<Id<"users">, Doc<"users"> | null>();
    for (const userId of creatorIds) {
      creatorMap.set(userId, await ctx.db.get("users", userId));
    }
    return rooms.map((room) => ({
      _id: room._id,
      name: room.name,
      subject: room.subject,
      createdAt: room.createdAt,
      createdBy: room.createdBy,
      createdByEmail: creatorMap.get(room.createdBy)?.email ?? "Unknown",
    }));
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", args.userId))
      .collect();
    const roomIds = new Set(rooms.map((room) => room._id));
    for (const room of rooms) {
      await deleteRoomCascade(ctx, room._id);
    }
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const membership of memberships) {
      if (!roomIds.has(membership.roomId)) {
        await ctx.db.delete(membership._id);
      }
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const message of messages) {
      if (!roomIds.has(message.roomId)) {
        await ctx.db.delete(message._id);
      }
    }
    const admin = await getAdminByUserId(ctx, args.userId);
    if (admin) {
      await ctx.db.delete(admin._id);
    }
    await ctx.db.delete(args.userId);
    return args.userId;
  },
});

export const deleteRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const room = await ctx.db.get("rooms", args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    await deleteRoomCascade(ctx, args.roomId);
    return args.roomId;
  },
});
