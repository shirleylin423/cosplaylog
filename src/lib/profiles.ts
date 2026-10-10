/**
 * 使用者暱稱與身分設定。
 *
 * 資料列層級安全政策只允許讀寫自己的 profile，所以不需要（也不能）在查詢裡
 * 判斷使用者身分。
 */

import { supabase } from "@/lib/backend";
import { isUserRole, normalizeEnabledRoles, type UserRole } from "./roles";

export type ProfileData = {
  displayName: string | null;
  /** 這個帳號會使用的身分（至少一個） */
  enabledRoles: UserRole[];
  /** 目前選用的身分 */
  activeRole: UserRole;
};

export async function getMyProfile(): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, enabled_roles, active_role")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const rawRoles = Array.isArray(data.enabled_roles) ? data.enabled_roles : [];
  const enabledRoles = normalizeEnabledRoles(rawRoles.filter(isUserRole));
  const activeRole =
    isUserRole(data.active_role) && enabledRoles.includes(data.active_role) ? data.active_role : enabledRoles[0];

  return {
    displayName: data.display_name?.trim() || null,
    enabledRoles,
    activeRole,
  };
}

/** 更新身分設定（跟著帳號走，換裝置也一樣） */
export async function updateMyRoles(
  userId: string,
  enabledRoles: UserRole[],
  activeRole: UserRole,
): Promise<void> {
  const roles = normalizeEnabledRoles(enabledRoles);
  const active = roles.includes(activeRole) ? activeRole : roles[0];

  const { error } = await supabase
    .from("profiles")
    .update({ enabled_roles: roles, active_role: active })
    .eq("id", userId);

  if (error) throw error;
}
