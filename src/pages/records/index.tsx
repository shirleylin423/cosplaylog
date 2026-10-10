import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { CalendarDays, LayoutGrid, LogOut, Trash2 } from "lucide-react";

import AppLoading from "@/components/app-loading";
import ThemeBackground from "@/components/theme-background";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useRecords } from "@/hooks/use-records";
import { useTheme } from "@/hooks/use-theme";
import { buildTypeColorMap, collectShootTypes, loadCustomTypes, saveCustomTypes } from "@/lib/shoot-types";
import { cleanupUnusedPhotos } from "@/lib/photo-storage";
import { collectRecentTags, collectTags } from "@/lib/record-tags";
import { averagePeriodForFilter } from "@/lib/stats";
import type { CosplayRecord, CosplayRecordInput } from "@/lib/record-types";
import { ROLE_ORDER, type UserRole } from "@/lib/roles";

import CalendarView from "./components/calendar-view";
import ExportRecordsButton from "./components/export-records-button";
import FilterBar from "./components/filter-bar";
import RecordsHeader from "./components/header";
import PhotoWallView from "./components/photo-wall-view";
import RecordDetail from "./components/record-detail";
import RecordForm from "./components/record-form";
import RoleSwitch from "./components/role-switch";
import StatsSummary from "./components/stats-summary";
import YearInReview from "./components/year-in-review";
import { createDefaultFilter, useFilteredRecords } from "./use-record-filters";

type View = "calendar" | "wall";

export default function RecordsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { themeKey, setThemeKey, theme } = useTheme();
  const { displayName, enabledRoles, activeRole, saveRoles } = useProfile(user?.id);

  const { records, isLoading, addRecord, updateRecord, deleteRecord, removePhotoIfUnused } = useRecords(user?.id);

  const [view, setView] = useState<View>("calendar");
  const [filter, setFilter] = useState(createDefaultFilter);
  const [search, setSearch] = useState("");
  const [display, setDisplay] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CosplayRecord | null>(null);
  const [detail, setDetail] = useState<CosplayRecord | null>(null);
  const [customTypes, setCustomTypes] = useState<string[]>(loadCustomTypes);
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);

  // 目前身分（本機先反應，同時寫回帳號設定）
  const currentRole: UserRole = roleOverride ?? activeRole;

  // 只顯示目前身分的紀錄（coser 看自己的出角紀錄、攝影看拍攝紀錄）
  const roleRecords = useMemo(
    () => records.filter((record) => record.role === currentRole),
    [records, currentRole],
  );

  const filtered = useFilteredRecords(roleRecords, filter, search);

  const shootTypes = useMemo(() => collectShootTypes(roleRecords, customTypes), [roleRecords, customTypes]);
  const typeColorMap = useMemo(
    () => buildTypeColorMap(shootTypes, theme.typeColors),
    [shootTypes, theme.typeColors],
  );

  // 手機寬度偵測（手機上月曆檢視單獨呈現）
  useEffect(() => {
    function onResize() {
      setIsNarrow(window.innerWidth < 640);
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 12/31 當天自動打開年度回憶（同一年只自動彈一次）
  useEffect(() => {
    if (isLoading) return;

    const today = new Date();
    if (today.getMonth() !== 11 || today.getDate() !== 31) return;

    const year = today.getFullYear();
    if (!roleRecords.some((record) => record.date.slice(0, 4) === String(year))) return;

    const seenKey = `stir-diary:review-seen:${year}`;

    try {
      if (localStorage.getItem(seenKey)) return;
      localStorage.setItem(seenKey, "1");
    } catch {
      /* 忽略讀寫失敗 */
    }

    setReviewOpen(true);
  }, [isLoading, roleRecords]);

  // 篩選改變時，月曆跟著跳到對應的月份
  // （只有「年份真的被換掉」才跳月份，否則像「回到今天」「清除篩選」會被覆蓋成 1 月）
  const previousFilterYear = useRef(filter.year);

  useEffect(() => {
    const yearChanged = previousFilterYear.current !== filter.year;
    previousFilterYear.current = filter.year;

    if (filter.mode === "month") {
      setDisplay({ year: filter.year, month: filter.month });
      return;
    }
    if (filter.mode === "year") {
      if (yearChanged) {
        const now = new Date();
        const isCurrentYear = filter.year === now.getFullYear();
        setDisplay({ year: filter.year, month: isCurrentYear ? now.getMonth() : 0 });
      }
      return;
    }
    if (filter.mode === "day" && filter.day) {
      const [year, month] = filter.day.split("-").map(Number);
      setDisplay({ year, month: month - 1 });
      return;
    }
    if (filter.mode === "range" && filter.start) {
      const [year, month] = filter.start.split("-").map(Number);
      setDisplay({ year, month: month - 1 });
    }
  }, [filter]);

  // 月曆要特別標示的日期
  const highlightSet = useMemo(() => {
    if (filter.mode === "day" && filter.day) {
      return new Set([filter.day]);
    }
    if (filter.mode === "range" && (filter.start || filter.end)) {
      return new Set(filtered.map((record) => record.date));
    }
    return null;
  }, [filter, filtered]);

  // 用過的標籤：表單只顯示最近 3 個，其餘在輸入時自動比對
  const tagOptions = useMemo(() => collectTags(roleRecords), [roleRecords]);
  const recentTags = useMemo(() => collectRecentTags(roleRecords, 3), [roleRecords]);

  // 年度回憶預設打開的年份：今年有紀錄就用今年，否則用最近有紀錄的那一年
  const reviewStartYear = useMemo(() => {
    const currentYear = new Date().getFullYear();

    if (roleRecords.some((record) => record.date.slice(0, 4) === String(currentYear))) {
      return currentYear;
    }

    const years = roleRecords
      .map((record) => Number(record.date.slice(0, 4)))
      .filter((year) => Number.isFinite(year) && year > 0)
      .sort((a, b) => b - a);

    return years.length ? years[0] : currentYear;
  }, [roleRecords]);

  const activeMonth = filter.mode === "month" ? filter.month : null;

  // 只要做了篩選或搜尋，就自動切到照片牆
  function handleFilter(next: typeof filter) {
    setFilter(next);
    setView("wall");
  }

  function handleSearch(term: string) {
    setSearch(term);
    if (term.trim()) setView("wall");
  }

  function applySearch(term: string) {
    setSearch(term);
    setView("wall");
  }

  function handleClear() {
    setFilter(createDefaultFilter());
    setSearch("");
    setView("calendar");
  }

  function onPickMonth(month: number) {
    handleFilter({ ...createDefaultFilter(), mode: "month", year: filter.year, month });
  }

  /** 點月曆上的某一天：跳到照片牆並只顯示那一天 */
  function handlePickDay(iso: string) {
    setDetail(null);
    handleFilter({
      ...createDefaultFilter(),
      mode: "day",
      year: Number(iso.slice(0, 4)),
      day: iso,
    });
  }

  /** 清理未使用的照片：把沒有任何紀錄用到的檔案刪掉，回收容量 */
  async function handleCleanupPhotos() {
    if (!user) return;

    // 所有身分的照片都要保留
    const keep = records.map((record) => record.photo).filter(Boolean);

    try {
      const deleted = await cleanupUnusedPhotos(keep, user.id);

      if (deleted > 0) {
        toast.success(t("cleanup.done", { count: deleted }));
      } else {
        toast.info(t("cleanup.none"));
      }
    } catch (error) {
      console.error("清理照片失敗：", error);
      toast.error(t("cleanup.failed"));
    }
  }

  /** 切換目前身分（同時寫回帳號設定，換裝置也一樣） */
  async function changeRole(role: UserRole) {
    setRoleOverride(role);

    try {
      await saveRoles(enabledRoles, role);
    } catch (error) {
      console.error("儲存身分設定失敗：", error);
      toast.error(t("role.saveFailed"));
    }
  }

  /** 啟用／關閉某個身分；至少要保留一個 */
  async function toggleRole(role: UserRole, enabled: boolean) {
    const nextEnabled = enabled
      ? ROLE_ORDER.filter((item) => item === role || enabledRoles.includes(item))
      : enabledRoles.filter((item) => item !== role);

    if (nextEnabled.length === 0) return;

    const nextActive = nextEnabled.includes(currentRole) ? currentRole : nextEnabled[0];

    setRoleOverride(nextActive);

    try {
      await saveRoles(nextEnabled, nextActive);
    } catch (error) {
      console.error("儲存身分設定失敗：", error);
      toast.error(t("role.saveFailed"));
    }
  }

  /** 回到今天：重設篩選並把月曆移回當月 */
  function handleToday() {
    const now = new Date();
    setFilter(createDefaultFilter());
    setSearch("");
    setDisplay({ year: now.getFullYear(), month: now.getMonth() });
  }

  function onTagClick(tag: string) {
    setDetail(null);
    applySearch(tag);
  }

  function addShootType(type: string) {
    setCustomTypes((current) => {
      if (current.includes(type) || shootTypes.includes(type)) return current;
      const next = [...current, type];
      saveCustomTypes(next);
      return next;
    });
  }

  async function handleSubmit(input: CosplayRecordInput) {
    if (editing) {
      const previousPhoto = editing.photo;
      await updateRecord(editing.id, input);

      // 換了新照片就把舊的刪掉（沒有其他紀錄在用時）
      if (previousPhoto && previousPhoto !== input.photo) {
        await removePhotoIfUnused(previousPhoto, editing.id);
      }
      return;
    }

    await addRecord(input);
  }

  async function handleLogout() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("登出失敗：", error);
    }
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <ThemeBackground themeKey={themeKey} />
        <AppLoading label={t("auth.loading")} />
      </div>
    );
  }

  // 詳情視窗永遠顯示清單中的最新版本
  const detailLive = detail ? records.find((record) => record.id === detail.id) ?? null : null;

  // 右上角顯示註冊時填的暱稱（讀不到時退回帳號資料）
  const accountName =
    displayName ??
    (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null) ??
    user.email ??
    t("common.user");

  function ViewToggle() {
    const options: { key: View; icon: typeof CalendarDays; label: string }[] = [
      { key: "calendar", icon: CalendarDays, label: t("records.view.calendar") },
      { key: "wall", icon: LayoutGrid, label: t("records.view.wall") },
    ];

    return (
      <div className="flex rounded-full p-0.5" style={{ background: "var(--accent-soft)" }}>
        {options.map(({ key, icon: Icon, label }) => {
          const active = view === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className="font-serif-tc flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={active ? { background: "var(--accent)", color: "var(--on-accent)" } : { color: "var(--text)" }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ThemeBackground themeKey={themeKey} />

      <RecordsHeader
        themeKey={themeKey}
        onThemeChange={setThemeKey}
        onAddRecord={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onOpenReview={() => setReviewOpen(true)}
        onHome={handleClear}
      />

      {/* 登入者資訊列 */}
      <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <RoleSwitch
            displayName={accountName}
            enabledRoles={enabledRoles}
            activeRole={currentRole}
            onChangeRole={changeRole}
            onToggleRole={toggleRole}
          />

          <ExportRecordsButton
            records={records}
            account={{ id: user.id, email: user.email ?? "", displayName: accountName }}
          />

          <button
            type="button"
            onClick={handleCleanupPhotos}
            className="font-serif-tc flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ background: "var(--accent-soft)", color: "var(--text)" }}
            title={t("cleanup.hint")}
          >
            <Trash2 size={15} />
            {t("cleanup.button")}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="font-serif-tc flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ background: "var(--accent-soft)", color: "var(--text)" }}
          >
            <LogOut size={15} />
            {t("common.logout")}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-4 sm:px-6 sm:py-6">
        {isNarrow && view === "calendar" ? (
          <>
            <CalendarView
              records={filtered}
              displayYear={display.year}
              displayMonth={display.month}
              onMonthChange={(year, month) => setDisplay({ year, month })}
              highlightSet={highlightSet}
              onPickDay={handlePickDay}
              onTodayClick={handleToday}
              typeColorMap={typeColorMap}
            />

            <div className="flex justify-center">
              <ViewToggle />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif-tc text-xl font-bold" style={{ color: "var(--text)" }}>
                  {t("records.annualLog", { year: filter.year })}
                </h2>
                <p className="font-deco text-muted-foreground mt-0.5 text-[10px] tracking-[0.25em]">
                  {t("records.annualLogDeco", { year: filter.year })}
                </p>
              </div>

              <ViewToggle />
            </div>

            <StatsSummary
              records={filtered}
              role={currentRole}
              averagePeriod={averagePeriodForFilter(filter)}
              typeColorMap={typeColorMap}
              onApplySearch={applySearch}
            />

            <FilterBar
              records={roleRecords}
              filter={filter}
              setFilter={handleFilter}
              count={filtered.length}
              search={search}
              setSearch={handleSearch}
              onClear={handleClear}
            />

            {view === "calendar" ? (
              <CalendarView
                records={filtered}
                displayYear={display.year}
                displayMonth={display.month}
                onMonthChange={(year, month) => setDisplay({ year, month })}
                highlightSet={highlightSet}
                onPickDay={handlePickDay}
                onTodayClick={handleToday}
                typeColorMap={typeColorMap}
              />
            ) : (
              <PhotoWallView
                records={filtered}
                activeMonth={activeMonth}
                onPickMonth={onPickMonth}
                onRecordClick={setDetail}
                onAddRecord={() => { setEditing(null); setFormOpen(true); }}
                typeColorMap={typeColorMap}
              />
            )}
          </>
        )}

        <footer className="pt-6 pb-safe text-center">
          <p className="font-deco text-muted-foreground text-[10px] tracking-[0.3em]">{t("records.footer")}</p>
        </footer>
      </main>

      <RecordForm
        open={formOpen}
        editing={editing}
        userId={user.id}
        shootTypes={shootTypes}
        typeColorMap={typeColorMap}
        role={currentRole}
        tagOptions={tagOptions}
        recentTags={recentTags}
        onAddShootType={addShootType}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />

      <RecordDetail
        record={detailLive}
        typeColorMap={typeColorMap}
        onDelete={deleteRecord}
        onEdit={(record) => {
          setDetail(null);
          setEditing(record);
          setFormOpen(true);
        }}
        onTagClick={onTagClick}
        onClose={() => setDetail(null)}
      />

      {reviewOpen && (
        <YearInReview
          records={roleRecords}
          role={currentRole}
          startYear={reviewStartYear}
          typeColorMap={typeColorMap}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </div>
  );
}
