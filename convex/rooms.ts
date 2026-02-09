import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/requireUser";

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

export const createRoom = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const name = args.name.trim();
    const subject = args.subject.trim();
    if (!name || !subject) {
      throw new Error("Room name and subject are required");
    }
    const roomId = await ctx.db.insert("rooms", {
      name,
      subject,
      createdBy: user._id,
      createdAt: now,
    });
    await ctx.db.insert("memberships", {
      roomId,
      userId: user._id,
      joinedAt: now,
    });
    return roomId;
  },
});
