import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface AlertRow {
  id: string;
  user_id: string;
  subscription_id: string | null;
  service: string;
  type: string;
  urgency: string;
  days_until: number | null;
  description: string;
  alert_date: string;
  resolved: boolean;
  resolved_at: string | null;
  notify_channels: string[];
  created_at: string;
}

export function useAlerts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AlertRow[];
    },
    enabled: !!user,
  });

  const computeAlerts = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.rpc("compute_alerts", { p_user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alertas recalculados");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alerta resolvido");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    alerts: query.data ?? [],
    isLoading: query.isLoading,
    computeAlerts,
    resolve,
    refetch: query.refetch,
  };
}
