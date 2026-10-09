import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecord, deleteRecord, listRecords, updateRecord } from "@/lib/records";
import { deleteStoredPhoto } from "@/lib/photo-storage";
import type { CosplayRecord, CosplayRecordInput } from "@/lib/record-types";

const QUERY_KEY = "cosplay-records";

/**
 * 目前登入者的紀錄。
 *
 * 讀取只會拿到自己的資料（資料庫政策限制）；新增／修改／刪除後重新抓取清單，
 * 讓月曆、照片牆與統計數字保持一致。
 *
 * 刪除紀錄時會一併刪掉照片檔，避免儲存空間留下沒人用的垃圾檔。
 */
export function useRecords(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: listRecords,
    enabled: Boolean(userId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

  const addMutation = useMutation({
    mutationFn: (input: CosplayRecordInput) => createRecord(userId as string, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CosplayRecordInput }) => updateRecord(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecord(id),
    onSuccess: invalidate,
  });

  const records: CosplayRecord[] = query.data ?? [];

  /** 這張照片還有其他紀錄在用嗎？（避免刪掉別筆紀錄還在用的照片） */
  function isPhotoStillUsed(photoUrl: string, exceptId: string): boolean {
    return records.some((record) => record.id !== exceptId && record.photo === photoUrl);
  }

  /** 刪除紀錄；紀錄刪除成功後再清掉沒人使用的照片檔 */
  async function removeRecord(id: string) {
    const target = records.find((record) => record.id === id);
    const photoToRemove = target?.photo ?? "";

    await deleteMutation.mutateAsync(id);

    if (!photoToRemove || !userId || isPhotoStillUsed(photoToRemove, id)) return;

    try {
      await deleteStoredPhoto(photoToRemove, userId);
    } catch (error) {
      // 照片刪不掉不影響紀錄已刪除的結果，只記錄下來
      console.error("刪除照片檔失敗：", error);
    }
  }

  return {
    records,
    isLoading: query.isPending,
    isError: query.isError,
    addRecord: (input: CosplayRecordInput) => addMutation.mutateAsync(input),
    updateRecord: (id: string, input: CosplayRecordInput) => updateMutation.mutateAsync({ id, input }),
    deleteRecord: removeRecord,
    /** 編輯時換掉照片後，清掉舊的那張（沒有其他紀錄在用時） */
    removePhotoIfUnused: async (photoUrl: string, exceptId: string) => {
      if (!photoUrl || !userId || isPhotoStillUsed(photoUrl, exceptId)) return;

      try {
        await deleteStoredPhoto(photoUrl, userId);
      } catch (error) {
        console.error("刪除舊照片檔失敗：", error);
      }
    },
  };
}
