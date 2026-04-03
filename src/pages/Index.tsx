import { DollarSign, TrendingUp, AlertTriangle, ShieldAlert, Calendar, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAlerts } from "@/hooks/useAlerts";
import { useOpportunities } from "@/hooks/useOpportunities";
import { useCostAnalytics } from "@/hooks/useCostAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-md px-3 py-2 text-xs shadow-lg">
        <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
        <p className="text-foreground font-bold font-mono text-sm">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const { alerts, isLoading: alertsLoading } = useAlerts();
  const { opportunities, isLoading: opportunitiesLoading } = useOpportunities();
  const { monthlyTotal, monthlyTrend, categoryBreakdown, topSpenders, isLoading: costsLoading } = useCostAnalytics();

  const criticalAlerts = alerts.filter((item) => item.urgency === "critico");
  const pendingOpps = opportunities.filter((item) => item.status === "a_avaliar" || item.status === "pendente");
  const nextRenewals = subscriptions
    .filter((item) => {
      if (!item.next_renewal) return false;
      const diff = (new Date(item.next_renewal).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff <= 15 && diff > 0;
    })
    .sort((a, b) => new Date(a.next_renewal ?? "2999-01-01").getTime() - new Date(b.next_renewal ?? "2999-01-01").getTime());

  if (subscriptionsLoading || alertsLoading || opportunitiesLoading || costsLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-8 w-52" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Skeleton className="lg:col-span-2 h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 canvas-stagger">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard Executivo</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Visão geral operacional conectada ao banco em tempo real</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Custo Mensal" value={`$${monthlyTotal.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={DollarSign} accent />
        <StatCard label="Projeção Anual" value={`$${(monthlyTotal * 12).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={TrendingUp} />
        <StatCard label="Alertas Críticos" value={String(criticalAlerts.length)} icon={AlertTriangle} accent />
        <StatCard label="Contas em Risco" value={String(subscriptions.filter(s => s.status === "pendente").length)} icon={ShieldAlert} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Evolução de Custo Mensal</div>
          <div className="h-52">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "JetBrains Mono" }} tickFormatter={(v) => `$${v}`} width={50} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Sem histórico suficiente para exibir tendência.</div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Distribuição por Categoria</div>
          <div className="h-36 flex justify-center">
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={2} strokeWidth={0}>
                    {categoryBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v}`} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Sem categorias com custo registrado.</div>
            )}
          </div>
          <div className="space-y-1 mt-2">
            {categoryBreakdown.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-[2px]" style={{ backgroundColor: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-mono text-foreground">${c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="label-sm">Alertas Críticos</div>
            <StatusBadge status="crítico" />
          </div>
          <div className="space-y-2">
            {alerts.filter(a => a.urgency === "critico" || a.urgency === "alto").slice(0, 4).map(a => (
              <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-md bg-secondary/40 border border-border/40 row-highlight">
                <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${a.urgency === "critico" ? "text-destructive" : "text-warning"}`} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{a.service}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{a.description}</div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <div className="text-xs text-muted-foreground">Nenhum alerta ativo neste momento.</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Próximos Vencimentos</div>
          <div className="space-y-2">
            {nextRenewals.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-md bg-secondary/40 border border-border/40 row-highlight">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{s.provider}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{s.next_renewal}</div>
                  </div>
                </div>
                <span className="font-mono text-[13px] text-foreground">${s.value}</span>
              </div>
            ))}
            {nextRenewals.length === 0 && <div className="text-xs text-muted-foreground">Nenhum vencimento nos próximos 15 dias.</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Oportunidades Pendentes</div>
          <div className="space-y-2">
            {pendingOpps.map(o => (
              <div key={o.id} className="flex items-start justify-between p-2.5 rounded-md bg-secondary/40 border border-border/40 row-highlight">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                    {o.tool || o.title}
                    <ArrowUpRight className="h-3 w-3 text-primary" />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{o.reason}</div>
                </div>
                <StatusBadge status={o.priority} />
              </div>
            ))}
            {pendingOpps.length === 0 && <div className="text-xs text-muted-foreground">Nenhuma oportunidade pendente.</div>}
          </div>
        </div>
      </div>

      {topSpenders.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Maiores Gastos</div>
          <div className="space-y-2.5">
            {topSpenders.map((item, index) => (
              <div key={`${item.kind}-${item.id}`} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground w-3 text-right">{index + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-foreground">{item.label}</span>
                    <span className="font-mono text-[13px] text-foreground">${item.value}</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full progress-shimmer rounded-full transition-all duration-500" style={{ width: `${(item.value / topSpenders[0].value) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
