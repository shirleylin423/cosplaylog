/**
 * 三款魔幻主題的中繼資料。
 *
 * 顏色的唯一來源是 src/index.css 的語意 token（以 [data-theme] 切換），
 * 這裡只放 CSS 表達不了的資料：名稱、說明、底色深淺，以及每款主題的紀錄類型配色。
 */

export type ThemeKey = "tarot" | "mucha" | "magic";

export type Theme = {
  key: ThemeKey;
  name: string;
  desc: string;
  /** 深色底主題（影響星光閃爍等裝飾的呈現） */
  dark: boolean;
  /** 依序分配給拍攝類型的顏色 */
  typeColors: string[];
};

export const THEMES: Record<ThemeKey, Theme> = {
  tarot: {
    key: "tarot",
    name: "塔羅牌",
    desc: "深夜藍底·星座級紙·日月與塔羅牌框",
    dark: true,
    typeColors: ["#d9b64e", "#8f2846", "#5b8fb0", "#a67fb5", "#c98a4b", "#6aa98a"],
  },
  mucha: {
    key: "mucha",
    name: "慕夏風",
    desc: "新藝術花卉·弧形光環·藤蔓曲線",
    dark: false,
    typeColors: ["#b8943f", "#bd8b96", "#7fa07f", "#9c7fb0", "#c08552", "#6f9bb0"],
  },
  magic: {
    key: "magic",
    name: "魔法陣",
    desc: "深紫黑底·發光符文·漂浮光粒",
    dark: true,
    typeColors: ["#7fd4e8", "#9b6dd6", "#e0b0e0", "#6fb0a8", "#c0a0e8", "#8fb8e0"],
  },
};

export const THEME_ORDER: ThemeKey[] = ["tarot", "mucha", "magic"];

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && value in THEMES;
}
