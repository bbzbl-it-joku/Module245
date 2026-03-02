import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = MutationCtx | QueryCtx;

export async function requireAdmin(ctx: AuthCtx): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const user = await ctx.db.get("users", userId);
  if (!user) {
    throw new Error("Unauthorized");
  }
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .unique();
  if (!admin) {
    throw new Error("Forbidden");
  }
  return user;
}
