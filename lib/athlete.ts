import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureAthlete(supabase: SupabaseClient, userId: string) {
  const { data: existing } = await supabase
    .from("athletes")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("athletes")
    .insert({ owner_user_id: userId })
    .select("id")
    .single();

  if (error) throw error;
  return created.id as string;
}
