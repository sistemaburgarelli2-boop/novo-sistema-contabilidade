import { cookies } from "next/headers";
import { fail, ok } from "@/lib/apiResponse";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "deivison5352@";
const ADMIN_COOKIE = "erp_super_admin";

export async function POST(request: Request) {
  const payload = await request.json();

  if (payload.username !== ADMIN_USERNAME || payload.password !== ADMIN_PASSWORD) {
    return fail("Usuario ou senha invalidos.", 401);
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "authenticated", {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return ok({ role: "super_admin", username: ADMIN_USERNAME });
}
