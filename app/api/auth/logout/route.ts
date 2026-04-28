import { cookies } from "next/headers";
import { ok } from "@/lib/apiResponse";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("erp_super_admin");

  return ok({ loggedOut: true });
}
