import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export interface UserSetting {
  id: string;
  user_id: string;
  setting_key: string;
  enabled: boolean;
}

export function useUserSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["user_settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("user_settings")
        .select("*")
        .order("setting_key");
      if (error) throw error;
      return data as UserSetting[];
    },
  });

  const settingsMap = (query.data ?? []).reduce<Record<string, boolean>>((acc, s) => {
    acc[s.setting_key] = s.enabled;
    return acc;
  }, {});

  const toggle = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await db
        .from("user_settings")
        .upsert(
          { user_id: user.id, setting_key: key, enabled },
          { onConflict: "user_id,setting_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    settings: query.data ?? [],
    settingsMap,
    isLoading: query.isLoading,
    toggle,
  };
}
