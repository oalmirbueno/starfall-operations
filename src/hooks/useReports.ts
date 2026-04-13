import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const db = supabase as any;

export interface ReportItem {
  id: string;
  name: string;
  date: string;
  type: string;
  status: string;
}

export function useReports() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const reports: ReportItem[] = [];

      // Subscription-based reports
      const { data: subs } = await db
        .from("subscriptions")
        .select("id, provider, value, cycle, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (subs?.length) {
        reports.push({
          id: "sub-report",
          name: `Relatório de Assinaturas — ${subs.length} ativas`,
          date: new Date().toISOString().slice(0, 10),
          type: "Custos",
          status: "disponível",
        });
      }

      // Infrastructure report
      const { data: infra } = await db
        .from("infrastructure_assets")
        .select("id, name, monthly_cost, status")
        .order("monthly_cost", { ascending: false })
        .limit(5);

      if (infra?.length) {
        reports.push({
          id: "infra-report",
          name: `Análise de Infraestrutura — ${infra.length} ativos`,
          date: new Date().toISOString().slice(0, 10),
          type: "Infra",
          status: "disponível",
        });
      }

      // Credentials audit
      const { data: creds } = await db
        .from("credentials")
        .select("id, provider, has_2fa, classification")
        .order("updated_at", { ascending: false });

      if (creds?.length) {
        const without2fa = creds.filter((c: any) => !c.has_2fa).length;
        reports.push({
          id: "cred-report",
          name: `Auditoria de Credenciais — ${without2fa} sem 2FA`,
          date: new Date().toISOString().slice(0, 10),
          type: "Segurança",
          status: "disponível",
        });
      }

      // Alerts summary
      const { data: alerts } = await db
        .from("alerts")
        .select("id, urgency, type, resolved")
        .eq("resolved", false);

      if (alerts?.length) {
        const critical = alerts.filter((a: any) => a.urgency === "critico").length;
        reports.push({
          id: "alert-report",
          name: `Alertas Ativos — ${critical} críticos de ${alerts.length} total`,
          date: new Date().toISOString().slice(0, 10),
          type: "Alertas",
          status: "disponível",
        });
      }

      // Opportunities
      const { data: opps } = await db
        .from("opportunities")
        .select("id, title, status, priority")
        .order("created_at", { ascending: false });

      if (opps?.length) {
        reports.push({
          id: "opp-report",
          name: `Oportunidades — ${opps.length} registradas`,
          date: new Date().toISOString().slice(0, 10),
          type: "Estratégia",
          status: "disponível",
        });
      }

      return reports;
    },
  });

  return {
    reports: query.data ?? [],
    isLoading: query.isLoading,
  };
}
