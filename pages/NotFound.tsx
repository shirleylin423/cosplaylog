import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="surface anim-fade-up rounded-3xl p-10 text-center">
        <h1 className="font-deco text-5xl font-bold" style={{ color: "var(--accent)" }}>
          404
        </h1>
        <p className="font-serif-tc mt-4 text-lg">{t("notFound.title")}</p>
        <Link
          to="/"
          className="btn-primary font-serif-tc mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-medium"
        >
          {t("notFound.actions.backHome")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
