import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  provider: string;
  account: string | null;
  plan: string | null;
  value: number;
  currency: string;
  cycle: string;
  next_renewal: string | null;
  auto_renew: boolean;
  status: string;
  responsible: string | null;
  notes: string | null;
  tags: string[];
  category: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscriptions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("next_renewal", { ascending: true });
      if (error) throw error;
      return data as SubscriptionRow[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: Omit<SubscriptionRow, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("subscriptions")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscriptions"] }); toast.success("Assinatura criada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<SubscriptionRow> & { id: string }) => {
      const { data, error } = await supabase.from("subscriptions").update(input).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscriptions"] }); toast.success("Assinatura atualizada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscriptions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscriptions"] }); toast.success("Assinatura removida"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { subscriptions: query.data ?? [], isLoading: query.isLoading, create, update, remove, refetch: query.refetch };
}
