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

  const topSpenders = [
    ...subscriptionsQuery.subscriptions.map((item) => ({
      id: item.id,
      label: item.provider,
      value: Number(item.value),
      kind: "subscription",
    })),
    ...infrastructureQuery.infrastructure.map((item) => ({
      id: item.id,
      label: item.name,
      value: Number(item.monthly_cost),
      kind: "infrastructure",
    })),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const monthlySubscriptionCost = subscriptionsQuery.subscriptions.reduce((acc, item) => {
    const value = Number(item.value);
    if (item.cycle === "anual") return acc + value / 12;
    if (item.cycle === "trimestral") return acc + value / 3;
    return acc + value;
  }, 0);

  const monthlyInfrastructureCost = infrastructureQuery.infrastructure.reduce(
    (acc, item) => acc + Number(item.monthly_cost),
    0,
  );

  return {
    monthlyTotal: monthlySubscriptionCost + monthlyInfrastructureCost,
    activeServices: subscriptionsQuery.subscriptions.filter((item) => item.status === "ativo").length,
    monthlyTrend: trendQuery.data ?? [],
    categoryBreakdown: breakdownQuery.data ?? [],
    topSpenders,
    isLoading:
      subscriptionsQuery.isLoading ||
      infrastructureQuery.isLoading ||
      trendQuery.isLoading ||
      breakdownQuery.isLoading,
    error: infrastructureQuery.error || trendQuery.error || breakdownQuery.error,
  };
}