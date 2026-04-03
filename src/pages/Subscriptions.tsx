import { useState } from "react";
import { subscriptions } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Filter } from "lucide-react";

export default function Subscriptions() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = ["all", ...Array.from(new Set(subscriptions.map(s => s.category)))];
  const filtered = subscriptions.filter(s => {
    const matchSearch = s.provider.toLowerCase().includes(search.toLowerCase()) || s.account.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Assinaturas</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão completa de assinaturas e serviços recorrentes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar provider ou conta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {c === "all" ? "Todos" : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 label-sm">Provider</th>
                <th className="text-left px-4 py-3 label-sm">Conta</th>
                <th className="text-left px-4 py-3 label-sm">Plano</th>
                <th className="text-right px-4 py-3 label-sm">Valor</th>
                <th className="text-left px-4 py-3 label-sm">Ciclo</th>
                <th className="text-left px-4 py-3 label-sm">Renovação</th>
                <th className="text-center px-4 py-3 label-sm">Auto</th>
                <th className="text-left px-4 py-3 label-sm">Status</th>
                <th className="text-left px-4 py-3 label-sm">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium text-foreground">{s.provider}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.account}</td>
                  <td className="px-4 py-3 text-foreground">{s.plan}</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{s.currency} {s.value}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.cycle}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.nextRenewal}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${s.autoRenew ? "bg-primary" : "bg-destructive"}`} />
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{s.responsible || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
