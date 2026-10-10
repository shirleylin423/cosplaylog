/** 使用者身分：coser（出角的人）或 photographer（拍攝的人） */

export type UserRole = "coser" | "photographer";

export const ROLE_ORDER: UserRole[] = ["coser", "photographer"];

export function isUserRole(value: unknown): value is UserRole {
  return value === "coser" || value === "photographer";
}

/** 角色名稱的 i18n key */
export function roleLabelKey(role: UserRole): string {
  return role === "coser" ? "role.coser" : "role.photographer";
}

/**
 * 「對方」欄位的標籤：coser 模式填的是幫你拍的攝影師，
 * 攝影模式填的是你拍的 coser。資料庫共用同一個欄位（photographer）。
 */
export function counterpartLabelKey(role: UserRole): string {
  return role === "coser" ? "form.photographer" : "form.coser";
}

export function counterpartPlaceholderKey(role: UserRole): string {
  return role === "coser" ? "form.photographerPlaceholder" : "form.coserPlaceholder";
}

/** 統計卡上的「最常合作對象」標題 */
export function topCounterpartLabelKey(role: UserRole): string {
  return role === "coser" ? "stats.topCounterpartCoser" : "stats.topCounterpartPhotographer";
}

/** 依使用者啟用的身分取出可切換的清單（至少一個） */
export function normalizeEnabledRoles(roles: UserRole[]): UserRole[] {
  const unique = ROLE_ORDER.filter((role) => roles.includes(role));
  return unique.length > 0 ? unique : ["coser"];
}
