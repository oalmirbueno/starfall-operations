const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  ativo: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
  online: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
  pendente: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  cancelado: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  expirado: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  offline: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  "manutenção": { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  a_avaliar: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  contratar: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
  descartado: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  "crítico": { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  alto: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  "médio": { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  baixo: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  alta: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  "média": { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  baixa: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig["baixo"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} pulse-dot`} />
      {status.replace("_", " ")}
    </span>
  );
}
