import { useMemo, useState } from "react";
import { Building2, Folder, FolderOpen, Search, Star, Files, Inbox, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Company, DocItem } from "@/hooks/useDocs";

interface Props {
  documents: DocItem[];
  companies: Company[];
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (v: boolean) => void;
  selectedCompany: string | "all";
  setSelectedCompany: (v: string | "all") => void;
  allCategories: string[];
}

export function DocsSidebar({
  documents, companies, categoryFilter, setCategoryFilter,
  favoritesOnly, setFavoritesOnly, selectedCompany, setSelectedCompany, allCategories,
}: Props) {
  const [q, setQ] = useState("");
  const [companiesOpen, setCompaniesOpen] = useState(true);

  const filteredCats = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? allCategories.filter(c => c.toLowerCase().includes(s)) : allCategories;
  }, [allCategories, q]);

  const totalCount = documents.length;
  const favCount = documents.filter(d => d.favorite).length;
  const noCatCount = documents.filter(d => !d.category).length;
  const countByCategory = (cat: string) => documents.filter(d => (d.category ?? "") === cat).length;
  const countByCompany = (cid: string) => documents.filter(d => d.company_id === cid).length;

  const isAllActive = categoryFilter === "all" && !favoritesOnly && selectedCompany === "all";

  return (
    <aside className="col-span-12 lg:col-span-3 xl:col-span-3 2xl:col-span-2 bg-card border border-border rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-border/60">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Biblioteca</h3>
          <span className="text-[10px] font-mono text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5">{totalCount}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Filtrar pastas…"
            className="h-7 pl-7 text-[11px] bg-secondary/40 border-border/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Quick views */}
        <div className="space-y-0.5">
          <SidebarRow
            icon={<Files className="h-3.5 w-3.5" />}
            label="Todos os documentos"
            count={totalCount}
            active={isAllActive}
            onClick={() => { setCategoryFilter("all"); setFavoritesOnly(false); setSelectedCompany("all"); }}
          />
          <SidebarRow
            icon={<Star className={`h-3.5 w-3.5 ${favoritesOnly ? "fill-current" : ""}`} />}
            label="Favoritos"
            count={favCount}
            active={favoritesOnly}
            tone={favoritesOnly ? "warning" : "default"}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          />
          <SidebarRow
            icon={<Inbox className="h-3.5 w-3.5" />}
            label="Sem categoria"
            count={noCatCount}
            active={categoryFilter === "__none__"}
            onClick={() => setCategoryFilter(categoryFilter === "__none__" ? "all" : "__none__")}
          />
        </div>

        {/* Categories — pastas */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Categorias</span>
            <span className="text-[10px] text-muted-foreground/70">{filteredCats.length}</span>
          </div>
          {filteredCats.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/70 italic px-2 py-3 text-center border border-dashed border-border/50 rounded-md">
              {q ? "Nenhuma pasta encontrada" : "Nenhuma categoria ainda"}
            </p>
          ) : (
            <div className="space-y-0.5">
              {filteredCats.map(cat => {
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(active ? "all" : cat)}
                    title={cat}
                    className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all ${
                      active
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "hover:bg-secondary/60 text-foreground/90"
                    }`}
                  >
                    <span className={`shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                      {active ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-[12px] leading-tight flex-1 break-words">{cat}</span>
                    <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-full ${
                      active ? "bg-primary/15 text-primary" : "bg-secondary/70 text-muted-foreground"
                    }`}>
                      {countByCategory(cat)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Companies — filtro secundário */}
        {companies.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setCompaniesOpen(o => !o)}
              className="w-full flex items-center justify-between px-1.5 group"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground flex items-center gap-1">
                {companiesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Empresas
              </span>
              <span className="text-[10px] text-muted-foreground/70">{companies.length}</span>
            </button>
            {companiesOpen && (
              <div className="space-y-0.5">
                {companies.map(c => {
                  const active = selectedCompany === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCompany(active ? "all" : c.id)}
                      title={c.name}
                      className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all ${
                        active ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "hover:bg-secondary/60 text-foreground/90"
                      }`}
                    >
                      {c.logo_url ? (
                        <img src={c.logo_url} alt="" className="h-4 w-4 rounded-sm shrink-0" />
                      ) : (
                        <Building2 className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      )}
                      <span className="text-[12px] leading-tight flex-1 break-words">{c.name}</span>
                      <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-full ${
                        active ? "bg-primary/15 text-primary" : "bg-secondary/70 text-muted-foreground"
                      }`}>
                        {countByCompany(c.id)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarRow({
  icon, label, count, active, onClick, tone = "default",
}: {
  icon: React.ReactNode; label: string; count: number; active: boolean;
  onClick: () => void; tone?: "default" | "warning";
}) {
  const activeCls = tone === "warning"
    ? "bg-warning/10 text-warning ring-1 ring-warning/30"
    : "bg-primary/10 text-primary ring-1 ring-primary/30";
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all ${
        active ? activeCls : "hover:bg-secondary/60 text-foreground/90"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[12px] flex-1 leading-tight">{label}</span>
      <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-full ${
        active ? "bg-current/15" : "bg-secondary/70 text-muted-foreground"
      }`}>{count}</span>
    </button>
  );
}
