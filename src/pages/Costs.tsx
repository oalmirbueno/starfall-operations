import { subscriptions, monthlyTrend, categoryBreakdown } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const totalMonthly = subscriptions.reduce((acc, s) => acc + (s.cycle === "mensal" ? s.value : s.cycle === "anual" ? s.value / 12 : s.value / 3), 0);
const topSpenders = [...subscriptions].sort((a, b) => b.value - a.value).slice(0, 5);

export default function Costs() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Custos & Consumo</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Análise detalhada de gastos recorrentes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-glow rounded-lg p-4 text-center glow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="label-sm mb-1.5">Mensal</div>
          <div className="text-2xl font-bold text-gradient font-mono">${totalMonthly.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="label-sm mb-1.5">Anual Projetado</div>
          <div className="text-2xl font-bold text-foreground font-mono">${(totalMonthly * 12).toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="label-sm mb-1.5">Serviços Ativos</div>
          <div className="text-2xl font-bold text-foreground">{subscriptions.filter(s => s.status === "ativo").length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Histórico Mensal</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(0,0%,42%)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0,0%,42%)", fontSize: 10, fontFamily: "JetBrains Mono" }} tickFormatter={(v) => `$${v}`} width={50} />
                <Tooltip contentStyle={{ background: "hsl(220,14%,6%)", border: "1px solid hsl(220,10%,16%)", borderRadius: "6px", fontSize: "10px", color: "#fff" }} />
                <Bar dataKey="total" fill="hsl(145, 85%, 48%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="label-sm mb-3">Por Categoria</div>
          <div className="h-44 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                  {categoryBreakdown.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v}`} contentStyle={{ background: "hsl(220,14%,6%)", border: "1px solid hsl(220,10%,16%)", borderRadius: "6px", fontSize: "10px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-1">
            {categoryBreakdown.map(c => (
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

      {/* Top Spenders */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="label-sm mb-3">Maiores Gastos</div>
        <div className="space-y-2.5">
          {topSpenders.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground w-3 text-right">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-foreground">{s.provider}</span>
                  <span className="font-mono text-[13px] text-foreground">${s.value}</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full progress-shimmer rounded-full transition-all duration-500" style={{ width: `${(s.value / topSpenders[0].value) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
