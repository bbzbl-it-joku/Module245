import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  rooms: defineTable({
    name: v.string(),
    subject: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_subject", ["subject"])
    .index("by_createdBy", ["createdBy"]),
  messages: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    content: v.string(),
    timestamp: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_userId", ["userId"]),
  memberships: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_userId", ["userId"])
    .index("by_roomId_userId", ["roomId", "userId"]),
});
