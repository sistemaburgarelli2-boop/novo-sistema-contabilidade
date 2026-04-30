import { cookies } from "next/headers";
import { ok } from "@/lib/apiResponse";
import { signOut } from "@/modules/auth/auth.service";

export async function POST() {
  await signOut().catch(() => null);

  const cookieStore = await cookies();
  cookieStore.delete("erp_super_admin");

  return ok({ loggedOut: true });
}
