import { infraResources } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Server } from "lucide-react";

export default function Infrastructure() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Infraestrutura</h1>
        <p className="text-sm text-muted-foreground mt-1">VPS, servidores, instâncias e recursos IaaS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 canvas-stagger">
        {infraResources.map(r => (
          <div key={r.id} className="bg-card border border-border rounded-lg p-5 card-hover cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{r.name}</span>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="text-foreground">{r.provider}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span className="text-foreground font-mono">{r.type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="text-foreground font-mono">{r.ip}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Região</span><span className="text-foreground">{r.region}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uso</span><span className="text-primary font-mono">{r.usage}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Custo</span><span className="text-foreground font-mono">${r.cost}/mês</span></div>
            </div>
            {r.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">{r.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
