import { fail } from "@/lib/apiResponse";

export function POST() {
  return fail("Login administrativo legado desativado. Use Supabase Auth.", 410);
}
