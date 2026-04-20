import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

interface InfrastructureSubscriptionLink {
  id: string;
  provider_id: string | null;
  account_id: string | null;
  provider: string;
  account: string | null;
  plan: string | null;
  value: number;
  cycle: string;
  status: string;
  payment_status: string;
  last_paid_at: string | null;
  next_renewal: string | null;
}

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
  linked_subscription_id?: string | null;
  payment_status?: string | null;
  last_paid_at?: string | null;
  effective_renewal_date?: string | null;
  effective_monthly_cost?: number;
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

const normalize = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const monthlyValue = (value: number, cycle: string) => {
  if (cycle === "anual") return value / 12;
  if (cycle === "trimestral") return value / 3;
  return value;
};

function getLinkScore(asset: InfrastructureAssetRow, subscription: InfrastructureSubscriptionLink) {
  let score = 0;

  if (asset.provider_id && subscription.provider_id && asset.provider_id === subscription.provider_id) score += 10;
  if (asset.account_id && subscription.account_id && asset.account_id === subscription.account_id) score += 6;

  const assetName = normalize(asset.name);
  const providerName = normalize(asset.provider_name);
  const accountName = normalize(asset.account_name);
  const subProvider = normalize(subscription.provider);
  const subPlan = normalize(subscription.plan);
  const subAccount = normalize(subscription.account);

  if (providerName && providerName === subProvider) score += 5;
  if (accountName && accountName === subAccount) score += 3;
  if (assetName && subPlan && assetName === subPlan) score += 5;
  if (assetName && subProvider && assetName === subProvider) score += 4;
  if (assetName && subPlan && (assetName.includes(subPlan) || subPlan.includes(assetName))) score += 3;
  if (assetName && subProvider && (assetName.includes(subProvider) || subProvider.includes(assetName))) score += 2;

  return score;
}

function linkInfrastructureWithSubscriptions(
  assets: InfrastructureAssetRow[],
  subscriptions: InfrastructureSubscriptionLink[],
) {
  const usedSubscriptionIds = new Set<string>();

  return assets
    .map((asset) => {
      let bestMatch: InfrastructureSubscriptionLink | null = null;
      let bestScore = 0;

      for (const subscription of subscriptions) {
        if (usedSubscriptionIds.has(subscription.id)) continue;
        const score = getLinkScore(asset, subscription);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = subscription;
        }
      }

      if (bestMatch && bestScore >= 4) {
        usedSubscriptionIds.add(bestMatch.id);
      } else {
        bestMatch = null;
      }

      const effectiveMonthlyCost = bestMatch
        ? monthlyValue(Number(bestMatch.value), bestMatch.cycle)
        : Number(asset.monthly_cost);

      return {
        ...asset,
        linked_subscription_id: bestMatch?.id ?? null,
        payment_status: bestMatch?.payment_status ?? null,
        last_paid_at: bestMatch?.last_paid_at ?? null,
        effective_renewal_date: bestMatch?.next_renewal ?? asset.renewal_date,
        effective_monthly_cost: effectiveMonthlyCost,
      } satisfies InfrastructureAssetRow;
    })
    .sort((a, b) => Number(b.effective_monthly_cost ?? b.monthly_cost) - Number(a.effective_monthly_cost ?? a.monthly_cost));
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
      const [{ data: assetsData, error: assetsError }, { data: subscriptionsData, error: subscriptionsError }] = await Promise.all([
        db
          .from("infrastructure_assets")
          .select(`
            *,
            providers:provider_id(name),
            accounts:account_id(name)
          `),
        db
          .from("subscriptions")
          .select("id, provider_id, account_id, provider, account, plan, value, cycle, status, payment_status, last_paid_at, next_renewal")
          .in("status", ["ativo", "pendente"]),
      ]);

      if (assetsError) throw assetsError;
      if (subscriptionsError) throw subscriptionsError;

      const assets = (assetsData ?? []).map((row: any) => ({
        ...row,
        provider_name: row.providers?.name ?? null,
        account_name: row.accounts?.name ?? null,
      })) as InfrastructureAssetRow[];

      return linkInfrastructureWithSubscriptions(
        assets,
        (subscriptionsData ?? []) as InfrastructureSubscriptionLink[],
      );
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
