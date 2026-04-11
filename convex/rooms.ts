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

    const roomsWithCounts = await Promise.all(
      filtered.map(async (room) => {
        const memberships = await ctx.db
          .query("memberships")
          .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
          .collect();

        return {
          _id: room._id,
          name: room.name,
          subject: room.subject,
          createdAt: room.createdAt,
          createdBy: room.createdBy,
          memberCount: memberships.length,
        };
      }),
    );

    return roomsWithCounts.sort((a, b) => {
      if (b.memberCount !== a.memberCount) {
        return b.memberCount - a.memberCount;
      }
      return b.createdAt - a.createdAt;
    });
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
