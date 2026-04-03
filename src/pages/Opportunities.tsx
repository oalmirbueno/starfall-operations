import { opportunities } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Lightbulb, ArrowUpRight } from "lucide-react";

const statusLabels: Record<string, string> = {
  a_avaliar: "A avaliar",
  pendente: "Pendente",
  contratar: "Contratar",
  descartado: "Descartado",
  ativo: "Ativo",
};

export default function Opportunities() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Oportunidades</h1>
        <p className="text-sm text-muted-foreground mt-1">Ferramentas, serviços e melhorias a avaliar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 canvas-stagger">
        {opportunities.map(o => (
          <div key={o.id} className="bg-card border border-border rounded-lg p-5 card-hover cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{o.tool}</span>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </div>
              <StatusBadge status={o.priority} />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span className="text-foreground">{o.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-foreground">{statusLabels[o.status]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Custo estimado</span><span className="font-mono text-foreground">${o.estimatedCost}/mês</span></div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">{o.reason}</p>

            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Benefício esperado</div>
              <p className="text-xs text-primary">{o.expectedBenefit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
