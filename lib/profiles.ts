import { supabase } from "@/lib/backend";

/**
 * 讀取自己的暱稱。
 *
 * 資料列層級安全政策只允許讀到自己的 profile，所以不需要（也不能）在查詢裡
 * 判斷使用者身分。
 */
export async function getMyDisplayName(): Promise<string | null> {
  const { data, error } = await supabase.from("profiles").select("display_name").maybeSingle();

  if (error) throw error;

  const name = data?.display_name?.trim();
  return name ? name : null;
}
