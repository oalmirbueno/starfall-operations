import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export interface InfrastructureAssetRow {
  id: string;
  user_id: string;
  provider_id: string | null;
  account_id: string | null;
  name: string;
  asset_type: string;
  status: string;
  region: string | null;
  ip_address: string | null;
  renewal_date: string | null;
  monthly_cost: number;
  usage_summary: string | null;
  responsible: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  provider_name?: string | null;
  account_name?: string | null;
}

export interface InfrastructureAssetInput {
  name: string;
  asset_type: string;
  status: string;
  region: string;
  ip_address: string;
  renewal_date: string;
  monthly_cost: number;
  usage_summary: string;
  responsible: string;
  notes: string;
  provider_name: string;
  account_name: string;
}

async function ensureProvider(userId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data: existing, error: existingError } = await db
    .from("providers")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", trimmed)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing.id as string;

  const { data, error } = await db
    .from("providers")
    .insert({ user_id: userId, name: trimmed, type: "infrastructure" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function ensureAccount(userId: string, providerId: string | null, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const query = db.from("accounts").select("id, name").eq("user_id", userId).ilike("name", trimmed);
  const { data: existing, error: existingError } = providerId
    ? await query.eq("provider_id", providerId).maybeSingle()
    : await query.maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing.id as string;

  const { data, error } = await db
    .from("accounts")
    .insert({ user_id: userId, provider_id: providerId, name: trimmed })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export function useInfrastructure() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["infrastructure", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("infrastructure_assets")
        .select(`
          *,
          providers:provider_id(name),
          accounts:account_id(name)
        `)
        .order("monthly_cost", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        provider_name: row.providers?.name ?? null,
        account_name: row.accounts?.name ?? null,
      })) as InfrastructureAssetRow[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: InfrastructureAssetInput) => {
      if (!user) throw new Error("Not authenticated");

      const providerId = await ensureProvider(user.id, input.provider_name);
      const accountId = await ensureAccount(user.id, providerId, input.account_name);

      const payload = {
        user_id: user.id,
        provider_id: providerId,
        account_id: accountId,
        name: input.name,
        asset_type: input.asset_type,
        status: input.status,
        region: input.region || null,
        ip_address: input.ip_address || null,
        renewal_date: input.renewal_date || null,
        monthly_cost: input.monthly_cost,
        usage_summary: input.usage_summary || null,
        responsible: input.responsible || null,
        notes: input.notes || null,
      };

      const { error } = await db.from("infrastructure_assets").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["infrastructure"] });
      qc.invalidateQueries({ queryKey: ["cost-trend"] });
      qc.invalidateQueries({ queryKey: ["cost-breakdown"] });
      toast.success("Recurso criado");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: InfrastructureAssetInput & { id: string }) => {
      if (!user) throw new Error("Not authenticated");

      const providerId = await ensureProvider(user.id, input.provider_name);
      const accountId = await ensureAccount(user.id, providerId, input.account_name);

      const { error } = await db
        .from("infrastructure_assets")
        .update({
          provider_id: providerId,
          account_id: accountId,
          name: input.name,
          asset_type: input.asset_type,
          status: input.status,
          region: input.region || null,
          ip_address: input.ip_address || null,
          renewal_date: input.renewal_date || null,
          monthly_cost: input.monthly_cost,
          usage_summary: input.usage_summary || null,
          responsible: input.responsible || null,
          notes: input.notes || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["infrastructure"] });
      qc.invalidateQueries({ queryKey: ["cost-trend"] });
      qc.invalidateQueries({ queryKey: ["cost-breakdown"] });
      toast.success("Recurso atualizado");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("infrastructure_assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["infrastructure"] });
      qc.invalidateQueries({ queryKey: ["cost-trend"] });
      qc.invalidateQueries({ queryKey: ["cost-breakdown"] });
      toast.success("Recurso removido");
    },
    onError: (error: any) => toast.error(error.message),
  });

  return {
    infrastructure: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create,
    update,
    remove,
  };
}