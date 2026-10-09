import { useEffect, useState } from "react";
import { THEMES, THEME_ORDER, isThemeKey, type Theme, type ThemeKey } from "@/lib/themes";

const LS_THEME = "stir-diary:theme";

function loadThemeKey(): ThemeKey {
  try {
    const saved = localStorage.getItem(LS_THEME);
    if (isThemeKey(saved) && THEME_ORDER.includes(saved)) {
      return saved;
    }
  } catch {
    /* 忽略讀取失敗 */
  }
  return "tarot";
}

/**
 * 主題狀態：把選擇寫進 <html data-theme>，由 src/index.css 的三組 token 接手換色。
 */
export function useTheme() {
  const [themeKey, setThemeKey] = useState<ThemeKey>(loadThemeKey);

  useEffect(() => {
    document.documentElement.dataset.theme = themeKey;

    try {
      localStorage.setItem(LS_THEME, themeKey);
    } catch {
      /* 忽略寫入失敗 */
    }

    // 讓已安裝 App 的狀態列／標題列顏色跟著主題走
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg-a").trim();

    if (meta && bg) {
      meta.content = bg;
    }
  }, [themeKey]);

  return {
    themeKey,
    setThemeKey,
    theme: THEMES[themeKey] as Theme,
  };
}
