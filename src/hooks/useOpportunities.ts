import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export interface OpportunityRow {
  id: string;
  user_id: string;
  title: string;
  tool: string | null;
  category: string | null;
  reason: string;
  status: string;
  estimated_cost: number;
  expected_benefit: string | null;
  priority: string;
  notes: string | null;
  responsible: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunityInput {
  title: string;
  tool: string;
  category: string;
  reason: string;
  status: string;
  estimated_cost: number;
  expected_benefit: string;
  priority: string;
  notes: string;
  responsible: string;
}

export function useOpportunities() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["opportunities", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from("opportunities").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OpportunityRow[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: OpportunityInput) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await db.from("opportunities").insert({
        user_id: user.id,
        title: input.title,
        tool: input.tool || null,
        category: input.category || null,
        reason: input.reason,
        status: input.status,
        estimated_cost: input.estimated_cost,
        expected_benefit: input.expected_benefit || null,
        priority: input.priority,
        notes: input.notes || null,
        responsible: input.responsible || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Oportunidade criada");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: OpportunityInput & { id: string }) => {
      const { error } = await db
        .from("opportunities")
        .update({
          title: input.title,
          tool: input.tool || null,
          category: input.category || null,
          reason: input.reason,
          status: input.status,
          estimated_cost: input.estimated_cost,
          expected_benefit: input.expected_benefit || null,
          priority: input.priority,
          notes: input.notes || null,
          responsible: input.responsible || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Oportunidade atualizada");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Oportunidade removida");
    },
    onError: (error: any) => toast.error(error.message),
  });

  return {
    opportunities: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create,
    update,
    remove,
  };
}