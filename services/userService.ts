import { getSupabaseClient } from "@/lib/supabaseClient";

export async function getUser() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  return data.user;
}
