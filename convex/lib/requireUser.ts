import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function requireUser(ctx: MutationCtx): Promise<Doc<"users">> {
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
