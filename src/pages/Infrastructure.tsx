import { infraResources } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Server, Cpu, HardDrive, Globe } from "lucide-react";

const typeIcons: Record<string, any> = {
  EC2: Cpu, RDS: HardDrive, S3: HardDrive, Droplet: Server, VPS: Server, GKE: Cpu,
};

export default function Infrastructure() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Infraestrutura</h1>
        <p className="text-xs text-muted-foreground mt-0.5">VPS, servidores, instâncias e recursos IaaS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 canvas-stagger">
        {infraResources.map(r => {
          const TypeIcon = typeIcons[r.type] || Server;
          return (
            <div key={r.id} className="bg-card border border-border rounded-lg p-4 card-hover cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/8 group-hover:bg-primary/12 transition-colors">
                    <TypeIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="text-[13px] font-medium text-foreground">{r.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">{r.type}</span>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="text-foreground">{r.provider}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Região</span><span className="text-foreground font-mono text-[10px]">{r.region}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="text-foreground font-mono text-[10px]">{r.ip}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Uso</span><span className="text-primary font-mono">{r.usage}</span></div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground">{r.notes}</span>
                <span className="font-mono text-[12px] text-foreground font-medium">${r.cost}<span className="text-muted-foreground text-[10px]">/mês</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
