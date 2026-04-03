import { opportunities } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Lightbulb, ArrowUpRight, Tag } from "lucide-react";

const statusLabels: Record<string, string> = {
  a_avaliar: "A avaliar", pendente: "Pendente", contratar: "Contratar", descartado: "Descartado", ativo: "Ativo",
};

export default function Opportunities() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Oportunidades</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Ferramentas, serviços e melhorias a avaliar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 canvas-stagger">
        {opportunities.map(o => (
          <div key={o.id} className="bg-card border border-border rounded-lg p-4 card-hover cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/8 group-hover:bg-primary/12 transition-colors">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[13px] font-medium text-foreground">{o.tool}</span>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <StatusBadge status={o.priority} />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span className="text-foreground">{o.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-foreground">{statusLabels[o.status]}</span></div>
              <div className="col-span-2 flex justify-between"><span className="text-muted-foreground">Custo estimado</span><span className="font-mono text-foreground">${o.estimatedCost}/mês</span></div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-2.5 line-clamp-2">{o.reason}</p>

            <div className="mt-2.5 pt-2.5 border-t border-border/40">
              <div className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] mb-0.5">Benefício</div>
              <p className="text-[11px] text-primary leading-relaxed">{o.expectedBenefit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
