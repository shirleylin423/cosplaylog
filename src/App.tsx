import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/auth-provider";
import { useServiceWorker } from "./hooks/use-service-worker";
import { routers } from "./router";

const queryClient = new QueryClient();

const App = () => {
  // basename 讓路由跟著部署的子目錄走：
  // 部署在 https://帳號.github.io/cosplaylog/ 時，BASE_URL 是 "/cosplaylog/"，路由才會正確對應；
  // 部署在網域根目錄時 BASE_URL 是 "/"，行為不變。
  const router = createBrowserRouter(routers, { basename: import.meta.env.BASE_URL });

  // 讓網站可以被安裝成 App（獨立視窗開啟）
  useServiceWorker();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
