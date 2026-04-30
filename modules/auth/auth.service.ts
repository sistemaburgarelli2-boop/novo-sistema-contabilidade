import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { LoginPayload } from "@/modules/auth/auth.types";
import { toSessionUser } from "@/modules/auth/auth.types";

export async function signInWithPassword(payload: LoginPayload) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error || !data.user) {
    throw new Error("Credenciais invalidas.");
  }

  return {
    user: toSessionUser(data.user),
  };
}

export async function getCurrentSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return toSessionUser(user);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
