import { subscriptions, monthlyTrend, categoryBreakdown } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const totalMonthly = subscriptions.reduce((acc, s) => acc + (s.cycle === "mensal" ? s.value : s.cycle === "anual" ? s.value / 12 : s.value / 3), 0);

const topSpenders = [...subscriptions].sort((a, b) => b.value - a.value).slice(0, 5);

export default function Costs() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Custos & Consumo</h1>
        <p className="text-sm text-muted-foreground mt-1">Análise detalhada de gastos recorrentes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 text-center">
          <div className="label-sm mb-2">Mensal</div>
          <div className="text-3xl font-bold text-primary font-mono">${totalMonthly.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 text-center">
          <div className="label-sm mb-2">Anual Projetado</div>
          <div className="text-3xl font-bold text-foreground font-mono">${(totalMonthly * 12).toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 text-center">
          <div className="label-sm mb-2">Serviços Ativos</div>
          <div className="text-3xl font-bold text-foreground">{subscriptions.filter(s => s.status === "ativo").length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="label-sm mb-4">Histórico Mensal</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(0,0%,7%)", border: "1px solid hsl(0,0%,17%)", borderRadius: "6px", fontSize: "11px", color: "#fff" }} />
                <Bar dataKey="total" fill="hsl(145, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="label-sm mb-4">Por Categoria</div>
          <div className="h-48 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {categoryBreakdown.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v}`} contentStyle={{ background: "hsl(0,0%,7%)", border: "1px solid hsl(0,0%,17%)", borderRadius: "6px", fontSize: "11px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {categoryBreakdown.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-mono text-foreground">${c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Spenders */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="label-sm mb-4">Maiores Gastos</div>
        <div className="space-y-3">
          {topSpenders.map((s, i) => (
            <div key={s.id} className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{s.provider}</span>
                  <span className="font-mono text-sm text-foreground">${s.value}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full progress-shimmer rounded-full" style={{ width: `${(s.value / topSpenders[0].value) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
