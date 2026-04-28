import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function getSupabaseClient() {
  return createSupabaseBrowserClient();
}
