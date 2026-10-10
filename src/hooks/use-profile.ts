import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyRoles } from "@/lib/profiles";
import type { UserRole } from "@/lib/roles";

/** 目前登入者的暱稱與身分設定 */
export function useProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: getMyProfile,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ enabledRoles, activeRole }: { enabledRoles: UserRole[]; activeRole: UserRole }) =>
      updateMyRoles(userId as string, enabledRoles, activeRole),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
  });

  return {
    displayName: query.data?.displayName ?? null,
    enabledRoles: query.data?.enabledRoles ?? (["coser"] as UserRole[]),
    activeRole: query.data?.activeRole ?? ("coser" as UserRole),
    saveRoles: (enabledRoles: UserRole[], activeRole: UserRole) =>
      mutation.mutateAsync({ enabledRoles, activeRole }),
  };
}
