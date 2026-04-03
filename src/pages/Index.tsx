import { DollarSign, TrendingUp, AlertTriangle, ShieldAlert, Calendar, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { subscriptions, alerts, opportunities, monthlyTrend, categoryBreakdown } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const totalMonthly = subscriptions.reduce((acc, s) => acc + (s.cycle === "mensal" ? s.value : s.cycle === "anual" ? s.value / 12 : s.value / 3), 0);
const criticalAlerts = alerts.filter(a => a.urgency === "crítico");
const pendingOpps = opportunities.filter(o => o.status === "a_avaliar" || o.status === "pendente");
const nextRenewals = subscriptions.filter(s => {
  const d = new Date(s.nextRenewal);
  const now = new Date("2026-04-03");
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 15 && diff > 0;
}).sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime());

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
  return (
    <div className="space-y-5 canvas-stagger">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard Executivo</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Visão geral do stack digital — Abril 2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Custo Mensal" value={`$${totalMonthly.toLocaleString("en", { minimumFractionDigits: 0 })}`} icon={DollarSign} trend="+3.8% vs mês anterior" trendUp={false} accent />
        <StatCard label="Projeção Anual" value={`$${(totalMonthly * 12).toLocaleString("en", { minimumFractionDigits: 0 })}`} icon={TrendingUp} />
        <StatCard label="Alertas Críticos" value={String(criticalAlerts.length)} icon={AlertTriangle} accent />
        <StatCard label="Contas em Risco" value={String(subscriptions.filter(s => s.status === "pendente").length)} icon={ShieldAlert} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Evolução de Custo Mensal</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(145, 85%, 48%)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(145, 85%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(0,0%,42%)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0,0%,42%)", fontSize: 10, fontFamily: "JetBrains Mono" }} tickFormatter={(v) => `$${v}`} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="hsl(145, 85%, 48%)" strokeWidth={1.5} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Distribuição por Categoria</div>
          <div className="h-36 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={2} strokeWidth={0}>
                  {categoryBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v}`} contentStyle={{ background: "hsl(220,14%,6%)", border: "1px solid hsl(220,10%,16%)", borderRadius: "6px", fontSize: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Critical Alerts */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="label-sm">Alertas Críticos</div>
            <StatusBadge status="crítico" />
          </div>
          <div className="space-y-2">
            {alerts.filter(a => a.urgency === "crítico" || a.urgency === "alto").slice(0, 4).map(a => (
              <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-md bg-secondary/40 border border-border/40 row-highlight">
                <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${a.urgency === "crítico" ? "text-destructive" : "text-warning"}`} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{a.service}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Renewals */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Próximos Vencimentos</div>
          <div className="space-y-2">
            {nextRenewals.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-md bg-secondary/40 border border-border/40 row-highlight">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{s.provider}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{s.nextRenewal}</div>
                  </div>
                </div>
                <span className="font-mono text-[13px] text-foreground">${s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Opportunities */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Oportunidades Pendentes</div>
          <div className="space-y-2">
            {pendingOpps.map(o => (
              <div key={o.id} className="flex items-start justify-between p-2.5 rounded-md bg-secondary/40 border border-border/40 row-highlight">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                    {o.tool}
                    <ArrowUpRight className="h-3 w-3 text-primary" />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{o.reason}</div>
                </div>
                <StatusBadge status={o.priority} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
