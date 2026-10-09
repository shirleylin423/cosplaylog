import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/context/auth-context";

/** 讀取目前的登入狀態與登入／註冊／登出動作 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth 必須在 AuthProvider 內使用");
  }

  return context;
}
