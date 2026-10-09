import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecord, deleteRecord, listRecords, updateRecord } from "@/lib/records";
import type { CosplayRecord, CosplayRecordInput } from "@/lib/record-types";

const QUERY_KEY = "cosplay-records";

/**
 * 目前登入者的紀錄。
 *
 * 讀取只會拿到自己的資料（資料庫政策限制）；新增／修改／刪除後重新抓取清單，
 * 讓月曆、照片牆與統計數字保持一致。
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

  return {
    records,
    isLoading: query.isPending,
    isError: query.isError,
    addRecord: (input: CosplayRecordInput) => addMutation.mutateAsync(input),
    updateRecord: (id: string, input: CosplayRecordInput) => updateMutation.mutateAsync({ id, input }),
    deleteRecord: (id: string) => deleteMutation.mutateAsync(id),
  };
}
