import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import AppLoading from "@/components/app-loading";

/**
 * 保護頁面：還沒還原完登入狀態時顯示載入畫面，未登入則轉址到登入頁。
 *
 * 登入成功後的跳轉由登入頁負責；這裡是「未登入就想直接開我的紀錄」的守門人。
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AppLoading />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
