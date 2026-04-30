import type { User } from "@supabase/supabase-js";

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthSessionUser = {
  id: string;
  email: string | null;
};

export function toSessionUser(user: User): AuthSessionUser {
  return {
    id: user.id,
    email: user.email ?? null,
  };
}
