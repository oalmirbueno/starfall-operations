import { useState, useEffect } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertTriangle, Clock, UserX, DollarSign, ToggleLeft, RefreshCw, CheckCircle, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const typeIcons: Record<string, any> = {
  vencimento: Clock,
  custo_alto: DollarSign,
  sem_responsavel: UserX,
  auto_renew_off: ToggleLeft,
  expiracao: AlertTriangle,
};

const urgencyLabel: Record<string, string> = {
  critico: "crítico",
  alto: "alto",
  medio: "médio",
  baixo: "baixo",
};

const urgencyOrder: Record<string, number> = { critico: 0, alto: 1, medio: 2, baixo: 3 };

export default function Alerts() {
  const { alerts, isLoading, computeAlerts, resolve } = useAlerts();
  const { subscriptions } = useSubscriptions();
  const [filter, setFilter] = useState<string>("all");

  // Auto-compute on first load if subscriptions exist and no alerts
  useEffect(() => {
    if (subscriptions.length > 0 && alerts.length === 0 && !isLoading) {
      computeAlerts.mutate();
    }
  }, [subscriptions.length]);

  const sorted = [...alerts]
    .filter(a => filter === "all" || a.urgency === filter)
    .sort((a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9));

  const counts = {
    critico: alerts.filter(a => a.urgency === "critico").length,
    alto: alerts.filter(a => a.urgency === "alto").length,
    medio: alerts.filter(a => a.urgency === "medio").length,
    baixo: alerts.filter(a => a.urgency === "baixo").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alertas & Renovações</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitoramento de vencimentos, riscos e pendências</p>
        </div>
        <Button
          onClick={() => computeAlerts.mutate()}
          disabled={computeAlerts.isPending}
          size="sm"
          variant="outline"
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${computeAlerts.isPending ? "animate-spin" : ""}`} />
          Recalcular
        </Button>
      </div>

      {/* Priority summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["critico", "alto", "medio", "baixo"] as const).map(u => (
          <button
            key={u}
            onClick={() => setFilter(filter === u ? "all" : u)}
            className={`bg-card border rounded-lg p-4 text-center transition-all ${filter === u ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/30"}`}
          >
            <div className="text-2xl font-bold text-foreground">{counts[u]}</div>
            <StatusBadge status={urgencyLabel[u]} />
          </button>
        ))}
      </div>

      {/* Empty state */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BellOff className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-medium text-foreground mb-1">Nenhum alerta ativo</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {subscriptions.length === 0
              ? "Adicione assinaturas primeiro para gerar alertas automaticamente"
              : "Todos os alertas foram resolvidos"}
          </p>
          {subscriptions.length > 0 && (
            <Button onClick={() => computeAlerts.mutate()} size="sm" variant="outline" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Recalcular Alertas
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 canvas-stagger">
          {sorted.map(a => {
            const Icon = typeIcons[a.type] || AlertTriangle;
            return (
              <div
                key={a.id}
                className={`bg-card border rounded-lg p-4 flex items-start gap-4 card-hover ${
                  a.urgency === "critico" ? "border-destructive/40" :
                  a.urgency === "alto" ? "border-warning/30" : "border-border"
                }`}
              >
                <div className={`p-2 rounded-md shrink-0 ${
                  a.urgency === "critico" ? "bg-destructive/10" :
                  a.urgency === "alto" ? "bg-warning/10" : "bg-secondary"
                }`}>
                  <Icon className={`h-4 w-4 ${
                    a.urgency === "critico" ? "text-destructive" :
                    a.urgency === "alto" ? "text-warning" : "text-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{a.service}</span>
                    <StatusBadge status={urgencyLabel[a.urgency]} />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      {a.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  {a.days_until !== null && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground font-mono">{a.days_until}d restantes</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground font-mono">{a.alert_date}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => resolve.mutate(a.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification readiness indicator */}
      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-xs font-medium text-foreground">Notificações</p>
          <p className="text-[11px] text-muted-foreground">
            Motor de alertas ativo • E-mail e Telegram disponíveis para configuração
          </p>
        </div>
        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">pronto</span>
      </div>
    </div>
  );
}
