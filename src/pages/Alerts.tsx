import { alerts } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertTriangle, Clock, UserX, DollarSign, ToggleLeft } from "lucide-react";

const typeIcons: Record<string, any> = {
  vencimento: Clock,
  custo_alto: DollarSign,
  sem_responsável: UserX,
  auto_renew_off: ToggleLeft,
  "expiração": AlertTriangle,
};

const urgencyOrder: Record<string, number> = { "crítico": 0, alto: 1, "médio": 2, baixo: 3 };

export default function Alerts() {
  const sorted = [...alerts].sort((a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Alertas & Renovações</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitoramento de vencimentos, riscos e pendências</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["crítico", "alto", "médio", "baixo"] as const).map(u => {
          const count = alerts.filter(a => a.urgency === u).length;
          return (
            <div key={u} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{count}</div>
              <StatusBadge status={u} />
            </div>
          );
        })}
      </div>

      {/* Alert List */}
      <div className="space-y-3 canvas-stagger">
        {sorted.map(a => {
          const Icon = typeIcons[a.type] || AlertTriangle;
          return (
            <div key={a.id} className={`bg-card border rounded-lg p-4 flex items-start gap-4 card-hover cursor-pointer ${a.urgency === "crítico" ? "border-destructive/40" : a.urgency === "alto" ? "border-warning/30" : "border-border"}`}>
              <div className={`p-2 rounded-md ${a.urgency === "crítico" ? "bg-destructive/10" : a.urgency === "alto" ? "bg-warning/10" : "bg-secondary"}`}>
                <Icon className={`h-4 w-4 ${a.urgency === "crítico" ? "text-destructive" : a.urgency === "alto" ? "text-warning" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{a.service}</span>
                  <StatusBadge status={a.urgency} />
                </div>
                <p className="text-sm text-muted-foreground">{a.description}</p>
              </div>
              <div className="text-xs text-muted-foreground font-mono shrink-0">{a.date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
