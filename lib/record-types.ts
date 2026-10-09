/** 攪拌紀錄的紀錄模型（畫面用的形狀，與資料庫欄位分開） */

export type CosplayRecord = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** 角色名 */
  character: string;
  /** 作品名 */
  series: string;
  /** 活動名稱 */
  event: string;
  /** 攝影師 */
  photographer: string;
  /** 拍攝類型 */
  type: string;
  /** 心得筆記 */
  note: string;
  /** 照片網址（可為空字串） */
  photo: string;
  tags: string[];
};

export type CosplayRecordInput = Omit<CosplayRecord, "id">;

export const EMPTY_RECORD_INPUT: CosplayRecordInput = {
  date: "",
  character: "",
  series: "",
  event: "",
  photographer: "",
  type: "",
  note: "",
  photo: "",
  tags: [],
};

export type RecordFilter = {
  mode: "year" | "month" | "day" | "range";
  year: number;
  month: number;
  day: string | null;
  start: string | null;
  end: string | null;
};
