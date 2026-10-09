import RequireAuth from "./components/auth/require-auth";
import LoginPage from "./pages/login";
import NotFound from "./pages/NotFound";
import RecordsPage from "./pages/records";

export const routers = [
  {
    path: "/login",
    name: "login",
    element: <LoginPage />,
  },
  {
    path: "/",
    name: "records",
    element: (
      <RequireAuth>
        <RecordsPage />
      </RequireAuth>
    ),
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
