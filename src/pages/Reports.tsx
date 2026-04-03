import { FileBarChart, Download, Calendar } from "lucide-react";

const reports = [
  { id: 1, name: "Relatório Mensal — Março 2026", date: "2026-03-31", type: "Custos", status: "disponível" },
  { id: 2, name: "Auditoria de Credenciais — Q1 2026", date: "2026-03-15", type: "Segurança", status: "disponível" },
  { id: 3, name: "Análise de Infraestrutura — Março 2026", date: "2026-03-31", type: "Infra", status: "disponível" },
  { id: 4, name: "Relatório de Oportunidades — Q1 2026", date: "2026-03-30", type: "Estratégia", status: "disponível" },
];

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Relatórios gerados e análises periódicas</p>
      </div>

      <div className="space-y-3 canvas-stagger">
        {reports.map(r => (
          <div key={r.id} className="bg-card border border-border rounded-lg p-5 flex items-center justify-between card-hover cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-md bg-primary/10">
                <FileBarChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{r.name}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{r.date}</span>
                  <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">{r.type}</span>
                </div>
              </div>
            </div>
            <button className="btn-interactive p-2 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-primary">
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Empty state hint */}
      <div className="bg-card border border-border/50 rounded-lg p-8 text-center">
        <div className="empty-state-icon inline-block mb-3">
          <FileBarChart className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Relatórios personalizados estarão disponíveis em breve.</p>
        <p className="text-xs text-muted-foreground mt-1">Configure filtros e períodos para gerar análises sob demanda.</p>
      </div>
    </div>
  );
}
