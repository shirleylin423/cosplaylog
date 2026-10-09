/**
 * 攪拌紀錄的資料存取層。
 *
 * 所有查詢都只會拿到登入者自己的資料 —— 真正的隔離由資料庫的資料列層級安全
 * （RLS）政策負責，前端不做、也不能做權限判斷。
 */

import { supabase } from "@/lib/backend";
import type { CosplayRecord, CosplayRecordInput } from "./record-types";

const TABLE = "cosplay_records";

type RecordRow = {
  id: string;
  user_id: string;
  record_date: string;
  character_name: string;
  series_title: string;
  event_name: string;
  photographer: string;
  shoot_type: string;
  note: string;
  photo_url: string | null;
  tags: string[] | null;
};

function rowToRecord(row: RecordRow): CosplayRecord {
  return {
    id: row.id,
    date: row.record_date,
    character: row.character_name,
    series: row.series_title ?? "",
    event: row.event_name ?? "",
    photographer: row.photographer ?? "",
    type: row.shoot_type,
    note: row.note ?? "",
    photo: row.photo_url ?? "",
    tags: row.tags ?? [],
  };
}

function inputToRow(record: CosplayRecordInput, userId: string) {
  return {
    user_id: userId,
    record_date: record.date,
    character_name: record.character,
    series_title: record.series ?? "",
    event_name: record.event ?? "",
    photographer: record.photographer ?? "",
    shoot_type: record.type || "外拍",
    note: record.note ?? "",
    photo_url: record.photo || null,
    tags: record.tags ?? [],
  };
}

export async function listRecords(): Promise<CosplayRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("record_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => rowToRecord(row as RecordRow));
}

export async function createRecord(userId: string, record: CosplayRecordInput): Promise<CosplayRecord> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(inputToRow(record, userId))
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("建立紀錄失敗");

  return rowToRecord(data as RecordRow);
}

export async function updateRecord(id: string, record: CosplayRecordInput): Promise<CosplayRecord> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      record_date: record.date,
      character_name: record.character,
      series_title: record.series ?? "",
      event_name: record.event ?? "",
      photographer: record.photographer ?? "",
      shoot_type: record.type || "外拍",
      note: record.note ?? "",
      photo_url: record.photo || null,
      tags: record.tags ?? [],
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("找不到這筆紀錄");

  return rowToRecord(data as RecordRow);
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) throw error;
}
