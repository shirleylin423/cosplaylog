import { useQuery } from "@tanstack/react-query";
import { getMyDisplayName } from "@/lib/profiles";

/** 目前登入者的暱稱（註冊時填寫的那個） */
export function useProfile(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: getMyDisplayName,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  return { displayName: query.data ?? null };
}
