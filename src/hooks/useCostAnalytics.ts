import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useInfrastructure } from "./useInfrastructure";
import { useSubscriptions } from "./useSubscriptions";

const db = supabase as any;

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--primary) / 0.55)",
];

function monthlyValue(value: number, cycle: string): number {
  if (cycle === "anual") return value / 12;
  if (cycle === "trimestral") return value / 3;
  return value;
}

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
      value: monthlyValue(Number(item.value), item.cycle),
      kind: "subscription",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Total mensal = soma das assinaturas ativas (que já incluem VPS etc)
  const monthlyTotal = activeSubscriptions.reduce(
    (acc, item) => acc + monthlyValue(Number(item.value), item.cycle),
    0,
  );

  // Payment breakdown
  const totalPago = activeSubscriptions
    .filter(s => (s as any).payment_status === "pago")
    .reduce((acc, s) => acc + monthlyValue(Number(s.value), s.cycle), 0);

  const totalPendente = activeSubscriptions
    .filter(s => (s as any).payment_status !== "pago")
    .reduce((acc, s) => acc + monthlyValue(Number(s.value), s.cycle), 0);

  return {
    monthlyTotal,
    totalPago,
    totalPendente,
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
