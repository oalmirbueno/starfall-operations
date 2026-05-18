import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useInfrastructure } from "./useInfrastructure";
import { useSubscriptions } from "./useSubscriptions";
import { monthlyValue, isPaidCurrentPeriod, isOverdue, monthsOverdue } from "@/lib/billing";

const db = supabase as any;

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--primary) / 0.55)",
];

export function useCostAnalytics() {
  const { user } = useAuth();
  const subscriptionsQuery = useSubscriptions();
  const infrastructureQuery = useInfrastructure();

  const trendQuery = useQuery({
    queryKey: ["cost-trend", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.rpc("get_monthly_cost_trend", { p_user_id: user.id });
      if (error) throw error;
      return data as Array<{ month: string; total: number }>;
    },
  });

  const breakdownQuery = useQuery({
    queryKey: ["cost-breakdown", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.rpc("get_category_cost_breakdown", { p_user_id: user.id });
      if (error) throw error;
      return (data as Array<{ name: string; value: number }>).map((item, index) => ({
        ...item,
        color: COLORS[index % COLORS.length],
      }));
    },
  });

  // Build top spenders from subscriptions only (infra items should be tracked as subscriptions too)
  const activeSubscriptions = subscriptionsQuery.subscriptions.filter(s => s.status === "ativo");

  const topSpenders = activeSubscriptions
    .map(item => ({
      id: item.id,
      label: item.provider + (item.account ? ` (${item.account})` : ""),
      value: monthlyValue(item),
      kind: "subscription",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Total mensal = soma das assinaturas ativas (que já incluem VPS etc)
  const monthlyTotal = activeSubscriptions.reduce(
    (acc, item) => acc + monthlyValue(item),
    0,
  );

  // Payment breakdown — agora baseado no CALENDÁRIO REAL do mês atual
  const totalPago = activeSubscriptions
    .filter(s => isPaidCurrentPeriod(s))
    .reduce((acc, s) => acc + monthlyValue(s), 0);

  const totalPendente = activeSubscriptions
    .filter(s => !isPaidCurrentPeriod(s))
    .reduce((acc, s) => acc + monthlyValue(s), 0);

  // Pendências de meses anteriores (atrasadas)
  const overdueSubscriptions = activeSubscriptions
    .filter(s => isOverdue(s))
    .map(s => ({ sub: s, months: monthsOverdue(s), monthly: monthlyValue(s) }))
    .sort((a, b) => b.months - a.months || b.monthly - a.monthly);

  const overdueTotal = overdueSubscriptions.reduce(
    (acc, x) => acc + x.monthly * Math.max(1, x.months),
    0,
  );

  return {
    monthlyTotal,
    totalPago,
    totalPendente,
    overdueSubscriptions,
    overdueTotal,
    overdueCount: overdueSubscriptions.length,
    activeServices: activeSubscriptions.length,
    monthlyTrend: trendQuery.data ?? [],
    categoryBreakdown: breakdownQuery.data ?? [],
    topSpenders,
    isLoading:
      subscriptionsQuery.isLoading ||
      trendQuery.isLoading ||
      breakdownQuery.isLoading,
    error: trendQuery.error || breakdownQuery.error,
  };
}

