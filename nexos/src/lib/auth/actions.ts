"use server";

import { getUserAccess, type UserAccess } from "@/lib/auth/user";

export type { UserAccess };

export async function getUserAccessAction(requireMfa = true): Promise<UserAccess> {
  return getUserAccess(requireMfa);
}