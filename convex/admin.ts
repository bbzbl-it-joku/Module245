import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./lib/requireAdmin";

type DbCtx = { db: QueryCtx["db"] };
const DEMO_ROOM_PREFIX = "[Demo]";
const DEMO_BOT_NAME_PREFIX = "DemoBot ";
const DEMO_BOT_MAX = 20;
const DEMO_USER_EMAIL_PREFIX = "demo.bot+";
const DEMO_USER_EMAIL_DOMAIN = "studycorner.local";
const DEMO_SUBJECTS = [
  "Mathematics",
  "Physics",
  "History",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Literature",
  "Economics",
];
const DEMO_TOPICS = [
  "Exam prep",
  "Homework support",
  "Quick Q&A",
  "Concept deep dive",
  "Weekly review",
  "Problem solving",
];
const DEMO_MESSAGE_TEMPLATES = [
  "Can someone explain {subject} in a simpler way?",
  "I just solved a tricky {subject} exercise.",
  "Does this approach for {subject} look correct?",
  "Sharing a short summary of today's {subject} topic.",
  "What should we revise first for {subject}?",
  "I found a useful pattern for this {subject} problem.",
  "Can we compare answers for this {subject} question?",
  "Any tips for improving speed in {subject} tasks?",
];

function randomIntInclusive(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomIntInclusive(0, items.length - 1)];
}

function isDemoRoom(roomName: string) {
  return roomName.startsWith(DEMO_ROOM_PREFIX);
}

function isDemoUserEmail(email: string | undefined) {
  return Boolean(email && email.startsWith(DEMO_USER_EMAIL_PREFIX));
}

function parseDemoBotNumber(name: string | undefined) {
  if (!name) {
    return null;
  }
  const match = /^DemoBot (\d+)$/.exec(name.trim());
  if (!match) {
    return null;
  }
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isDemoUser(user: Doc<"users">) {
  return isDemoUserEmail(user.email) || parseDemoBotNumber(user.name) !== null;
}

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

async function ensureMembership(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  userId: Id<"users">,
  joinedAt: number,
) {
  const existing = await ctx.db
    .query("memberships")
    .withIndex("by_roomId_userId", (q) =>
      q.eq("roomId", roomId).eq("userId", userId),
    )
    .unique();
  if (existing) {
    return existing._id;
  }
  return await ctx.db.insert("memberships", {
    roomId,
    userId,
    joinedAt,
  });
}

async function ensureDemoUsers(ctx: MutationCtx, minimumCount: number) {
  const users = await ctx.db.query("users").collect();
  const discoveredDemoUsers = users
    .filter((user) => isDemoUser(user))
    .sort((a, b) => {
      const aNumber = parseDemoBotNumber(a.name);
      const bNumber = parseDemoBotNumber(b.name);
      if (aNumber !== null && bNumber !== null && aNumber !== bNumber) {
        return aNumber - bNumber;
      }
      if (aNumber !== null && bNumber === null) {
        return -1;
      }
      if (aNumber === null && bNumber !== null) {
        return 1;
      }
      return a._creationTime - b._creationTime;
    });
  const reusableDemoUsers = discoveredDemoUsers.slice(0, DEMO_BOT_MAX);
  for (let index = 0; index < reusableDemoUsers.length; index += 1) {
    const canonicalName = `${DEMO_BOT_NAME_PREFIX}${index + 1}`;
    if (reusableDemoUsers[index].name !== canonicalName) {
      await ctx.db.patch(reusableDemoUsers[index]._id, {
        name: canonicalName,
      });
      const updated = await ctx.db.get(reusableDemoUsers[index]._id);
      if (!updated) {
        throw new Error("Failed to update demo user");
      }
      reusableDemoUsers[index] = updated;
    }
  }

  const targetCount = Math.min(
    DEMO_BOT_MAX,
    Math.max(1, Math.floor(minimumCount)),
  );
  const missing = Math.max(0, targetCount - reusableDemoUsers.length);
  for (let index = 0; index < missing; index += 1) {
    const botNumber = reusableDemoUsers.length + 1;
    const userId = await ctx.db.insert("users", {
      name: `${DEMO_BOT_NAME_PREFIX}${botNumber}`,
      email: `${DEMO_USER_EMAIL_PREFIX}${Date.now()}-${botNumber}@${DEMO_USER_EMAIL_DOMAIN}`,
      emailVerificationTime: Date.now(),
    });
    const created = await ctx.db.get(userId);
    if (!created) {
      throw new Error("Failed to create demo user");
    }
    reusableDemoUsers.push(created);
  }
  return reusableDemoUsers.map((user) => user._id);
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

export const createDemoRooms = mutation({
  args: {
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdmin(ctx);
    const count = Math.max(1, Math.min(12, Math.floor(args.count ?? 6)));
    const roomIds: Id<"rooms">[] = [];
    for (let index = 0; index < count; index += 1) {
      const subject = pickRandom(DEMO_SUBJECTS);
      const topic = pickRandom(DEMO_TOPICS);
      const roomId = await ctx.db.insert("rooms", {
        name: `${DEMO_ROOM_PREFIX} ${subject} ${topic}`,
        subject,
        createdBy: adminUser._id,
        createdAt: Date.now(),
      });
      await ensureMembership(ctx, roomId, adminUser._id, Date.now());
      roomIds.push(roomId);
    }
    return {
      createdCount: roomIds.length,
      roomIds,
    };
  },
});

export const scheduleDemoMessages = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rooms = await ctx.db.query("rooms").collect();
    const demoRooms = rooms.filter((room) => isDemoRoom(room.name));
    if (demoRooms.length === 0) {
      throw new Error("No demo rooms found. Create demo rooms first.");
    }
    const demoUserIds = await ensureDemoUsers(ctx, 8);
    const cycleCount = 20;
    let cycleDelayMs = 0;
    let scheduledMessages = 0;
    for (let cycle = 0; cycle < cycleCount; cycle += 1) {
      if (cycle > 0) {
        cycleDelayMs += randomIntInclusive(500, 3000);
      }
      for (const room of demoRooms) {
        const messagesThisCycle = randomIntInclusive(1, 3);
        for (let index = 0; index < messagesThisCycle; index += 1) {
          const messageDelayMs = cycleDelayMs + index * randomIntInclusive(60, 240);
          const userId = pickRandom(demoUserIds);
          const content = pickRandom(DEMO_MESSAGE_TEMPLATES).replace(
            /\{subject\}/g,
            room.subject,
          );
          await ctx.scheduler.runAfter(
            messageDelayMs,
            internal.admin.insertScheduledDemoMessage,
            {
              roomId: room._id,
              userId,
              content,
              timestamp: Date.now() + messageDelayMs,
            },
          );
          scheduledMessages += 1;
        }
      }
    }
    return {
      cycleCount,
      roomCount: demoRooms.length,
      scheduledMessages,
    };
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

export const insertScheduledDemoMessage = internalMutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    content: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    const message = args.content.trim();
    if (!message) {
      throw new Error("Message content is empty");
    }
    await ensureMembership(ctx, args.roomId, args.userId, args.timestamp);
    return await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: args.userId,
      content: message,
      timestamp: args.timestamp,
    });
  },
});
