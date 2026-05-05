import { useMemo, useState } from "react";
import { Building2, Folder, FolderOpen, FolderKanban, Search, Star, Files, Inbox, ChevronDown, ChevronRight, Plus, Pencil, Trash2, Tag as TagIcon, Layers, Check, X, Palette, MoreVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDocCategories, DocCategory } from "@/hooks/useDocCategories";
import type { Company, DocItem, DocProject } from "@/hooks/useDocs";

interface Props {
  documents: DocItem[];
  companies: Company[];
  projects: DocProject[];
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (v: boolean) => void;
  selectedCompany: string | "all";
  setSelectedCompany: (v: string | "all") => void;
  selectedProject: string | "all" | "none";
  setSelectedProject: (v: string | "all" | "none") => void;
  allCategories: string[];
  onNewProject?: (parentId?: string | null, companyId?: string | null) => void;
}

const COLOR_PRESETS = [
  { name: "Padrão", value: null, swatch: "hsl(var(--muted-foreground))" },
  { name: "Azul", value: "#3b82f6", swatch: "#3b82f6" },
  { name: "Verde", value: "#10b981", swatch: "#10b981" },
  { name: "Âmbar", value: "#f59e0b", swatch: "#f59e0b" },
  { name: "Rosa", value: "#ec4899", swatch: "#ec4899" },
  { name: "Roxo", value: "#8b5cf6", swatch: "#8b5cf6" },
  { name: "Vermelho", value: "#ef4444", swatch: "#ef4444" },
  { name: "Ciano", value: "#06b6d4", swatch: "#06b6d4" },
];

export function DocsSidebar({
  documents, companies, projects, categoryFilter, setCategoryFilter,
  favoritesOnly, setFavoritesOnly, selectedCompany, setSelectedCompany,
  selectedProject, setSelectedProject, allCategories, onNewProject,
}: Props) {
  const { list: catsQ, create, rename, setColor, remove, reorder } = useDocCategories();
  const dbCats = catsQ.data ?? [];

  const [q, setQ] = useState("");
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const totalCount = documents.length;
  const favCount = documents.filter(d => d.favorite).length;
  const noProjectCount = documents.filter(d => !d.project_id).length;
  const noCatCount = documents.filter(d => !d.category).length;
  const countByCategory = (cat: string) => documents.filter(d => (d.category ?? "") === cat).length;
  const countByCompany = (cid: string) => documents.filter(d => d.company_id === cid).length;
  const countByProject = (pid: string) => documents.filter(d => d.project_id === pid).length;

  // Projetos agrupados por empresa, filtrados pelo search
  const projectsByCompany = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = projects.filter(p => !s || p.name.toLowerCase().includes(s));
    const map = new Map<string, { company: Company | null; items: DocProject[] }>();
    filtered.forEach(p => {
      const key = p.company_id ?? "__no_company__";
      if (!map.has(key)) {
        map.set(key, { company: companies.find(c => c.id === p.company_id) ?? null, items: [] });
      }
      map.get(key)!.items.push(p);
    });
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => (a.company?.name ?? "ZZ").localeCompare(b.company?.name ?? "ZZ"));
  }, [projects, companies, q]);

  // Categorias mescladas
  const mergedCats = useMemo(() => {
    const byName = new Map<string, { name: string; cat?: DocCategory }>();
    [...dbCats].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
      .forEach(c => byName.set(c.name, { name: c.name, cat: c }));
    allCategories.forEach(n => { if (!byName.has(n)) byName.set(n, { name: n }); });
    let arr = Array.from(byName.values());
    const s = q.trim().toLowerCase();
    if (s) arr = arr.filter(x => x.name.toLowerCase().includes(s));
    return arr;
  }, [dbCats, allCategories, q]);

  const isAllActive = categoryFilter === "all" && !favoritesOnly && selectedCompany === "all" && selectedProject === "all";

  const handleCreate = async () => {
    const v = newName.trim();
    if (!v) { setAdding(false); return; }
    await create.mutateAsync({ name: v });
    setNewName(""); setAdding(false);
  };

  const handleRename = async (item: { name: string; cat?: DocCategory }) => {
    const v = editName.trim();
    if (!v || v === item.name) { setEditingId(null); return; }
    if (item.cat) {
      await rename.mutateAsync({ id: item.cat.id, oldName: item.name, newName: v });
    } else {
      await create.mutateAsync({ name: v });
    }
    setEditingId(null);
  };

  const moveCat = async (idx: number, dir: -1 | 1) => {
    const onlyDb = mergedCats.filter(m => m.cat).map(m => m.cat!) as DocCategory[];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= onlyDb.length) return;
    const arr = [...onlyDb];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    await reorder.mutateAsync(arr);
  };

  return (
    <aside className="col-span-12 lg:col-span-3 xl:col-span-3 2xl:col-span-2 bg-card border border-border rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
      <div className="px-3 pt-3 pb-2 border-b border-border/60">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Biblioteca</h3>
          <span className="text-[10px] font-mono text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5">{totalCount}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Filtrar projetos / categorias…"
            className="h-7 pl-7 text-[11px] bg-secondary/40 border-border/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Quick filters */}
        <div className="space-y-0.5">
          <SidebarRow
            icon={<Files className="h-3.5 w-3.5" />} label="Todos os documentos" count={totalCount}
            active={isAllActive}
            onClick={() => { setCategoryFilter("all"); setFavoritesOnly(false); setSelectedCompany("all"); setSelectedProject("all"); }}
          />
          <SidebarRow
            icon={<Star className={`h-3.5 w-3.5 ${favoritesOnly ? "fill-current" : ""}`} />} label="Favoritos" count={favCount}
            active={favoritesOnly} tone={favoritesOnly ? "warning" : "default"}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          />
          <SidebarRow
            icon={<Inbox className="h-3.5 w-3.5" />} label="Sem pasta" count={noProjectCount}
            active={selectedProject === "none"}
            onClick={() => setSelectedProject(selectedProject === "none" ? "all" : "none")}
          />
        </div>

        {/* PASTAS — navegação principal (com sub-pastas) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1.5">
            <button onClick={() => setProjectsOpen(o => !o)}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              {projectsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <FolderKanban className="h-3 w-3" />
              Pastas
              <span className="ml-1 text-muted-foreground/70 normal-case font-mono">({projects.length})</span>
            </button>
            {onNewProject && (
              <button onClick={() => onNewProject(null, null)}
                className="text-muted-foreground hover:text-primary p-0.5 rounded transition-colors" title="Nova pasta">
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>

          {projectsOpen && (
            projects.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/70 italic px-2 py-3 text-center border border-dashed border-border/50 rounded-md">
                Nenhuma pasta criada
              </p>
            ) : (
              <div className="space-y-2">
                {projectsByCompany.map(group => {
                  const childrenOf = (parentId: string | null) =>
                    group.items.filter(p => (p.parent_id ?? null) === parentId);

                  const renderFolder = (p: DocProject, depth: number) => {
                    const active = selectedProject === p.id;
                    const color = p.color ?? null;
                    const subs = childrenOf(p.id);
                    return (
                      <div key={p.id} className="space-y-0.5">
                        <div
                          className={`group flex items-center gap-1 rounded-md transition-all ${
                            active ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "hover:bg-secondary/60 text-foreground/90"
                          }`}
                          style={{ paddingLeft: depth * 10 }}
                        >
                          <button
                            onClick={() => setSelectedProject(active ? "all" : p.id)}
                            title={p.name}
                            className="flex-1 flex items-center gap-2 px-2 py-1.5 text-left min-w-0"
                          >
                            <span className="shrink-0" style={color ? { color } : undefined}>
                              {active ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
                            </span>
                            <span className="text-[12px] leading-tight flex-1 break-words">{p.name}</span>
                            <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-full ${
                              active ? "bg-primary/15 text-primary" : "bg-secondary/70 text-muted-foreground"
                            }`}>{countByProject(p.id)}</span>
                          </button>
                          {onNewProject && depth === 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onNewProject(p.id, p.company_id); }}
                              title="Nova sub-pasta"
                              className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-muted-foreground hover:text-primary transition-opacity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        {subs.length > 0 && (
                          <div className="space-y-0.5 border-l border-border/40 ml-3">
                            {subs.map(s => renderFolder(s, depth + 1))}
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div key={group.key} className="space-y-0.5">
                      <div className="flex items-center justify-between px-1.5 py-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/80">
                          <Building2 className="h-2.5 w-2.5" />
                          <span className="truncate">{group.company?.name ?? "Sem empresa"}</span>
                        </div>
                        {onNewProject && group.company && (
                          <button
                            onClick={() => onNewProject(null, group.company!.id)}
                            title="Nova pasta nesta empresa"
                            className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-0.5 text-muted-foreground hover:text-primary"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                      {childrenOf(null).map(p => renderFolder(p, 0))}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* CATEGORIAS — etiquetas/temas */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1.5">
            <button onClick={() => setCategoriesOpen(o => !o)}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              {categoriesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <Layers className="h-3 w-3" />
              Categorias
              <span className="ml-1 text-muted-foreground/70 normal-case font-mono">({mergedCats.length})</span>
            </button>
            <button onClick={() => { setAdding(true); setNewName(""); setCategoriesOpen(true); }}
              className="text-muted-foreground hover:text-primary p-0.5 rounded transition-colors" title="Nova categoria">
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {categoriesOpen && (
            <>
              <button onClick={() => setCategoryFilter(categoryFilter === "__none__" ? "all" : "__none__")}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-all ${
                  categoryFilter === "__none__" ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "hover:bg-secondary/60 text-foreground/80"
                }`}>
                <Inbox className="h-3 w-3 shrink-0" />
                <span className="text-[11px] flex-1">Sem categoria</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-secondary/70 text-muted-foreground">{noCatCount}</span>
              </button>

              {adding && (
                <div className="flex items-center gap-1 px-1">
                  <Input
                    autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setAdding(false); }}
                    placeholder="Nome da categoria…" className="h-7 text-[11px] bg-secondary/50"
                  />
                  <button onClick={handleCreate} className="p-1 text-primary hover:bg-primary/10 rounded"><Check className="h-3 w-3" /></button>
                  <button onClick={() => setAdding(false)} className="p-1 text-muted-foreground hover:bg-secondary/60 rounded"><X className="h-3 w-3" /></button>
                </div>
              )}

              {mergedCats.length === 0 && !adding ? (
                <p className="text-[11px] text-muted-foreground/70 italic px-2 py-2 text-center">
                  Nenhuma categoria
                </p>
              ) : (
                <div className="space-y-0.5">
                  {mergedCats.map((item) => {
                    const cat = item.cat;
                    const active = categoryFilter === item.name;
                    const isEditing = editingId === (cat?.id ?? item.name);
                    const color = cat?.color ?? null;
                    const dbIdx = cat ? mergedCats.filter(m => m.cat).findIndex(m => m.cat?.id === cat.id) : -1;
                    const dbTotal = mergedCats.filter(m => m.cat).length;

                    if (isEditing) {
                      return (
                        <div key={item.name} className="flex items-center gap-1 px-1">
                          <Input
                            autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleRename(item); if (e.key === "Escape") setEditingId(null); }}
                            className="h-7 text-[11px] bg-secondary/50"
                          />
                          <button onClick={() => handleRename(item)} className="p-1 text-primary hover:bg-primary/10 rounded"><Check className="h-3 w-3" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-secondary/60 rounded"><X className="h-3 w-3" /></button>
                        </div>
                      );
                    }

                    return (
                      <div key={item.name}
                        className={`group flex items-center gap-1 rounded-md transition-all ${
                          active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-secondary/60"
                        }`}
                      >
                        <button
                          onClick={() => setCategoryFilter(active ? "all" : item.name)}
                          title={item.name}
                          className={`flex-1 flex items-center gap-2 px-2 py-1.5 text-left min-w-0 ${active ? "text-primary" : "text-foreground/90"}`}
                        >
                          <span className="shrink-0" style={color ? { color } : undefined}>
                            <TagIcon className="h-3 w-3" />
                          </span>
                          <span className="text-[12px] leading-tight flex-1 break-words">{item.name}</span>
                          <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-full ${
                            active ? "bg-primary/15 text-primary" : "bg-secondary/70 text-muted-foreground"
                          }`}>{countByCategory(item.name)}</span>
                        </button>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center pr-1 transition-opacity">
                          <CategoryActions
                            item={item}
                            canReorder={!!cat}
                            canMoveUp={dbIdx > 0}
                            canMoveDown={dbIdx >= 0 && dbIdx < dbTotal - 1}
                            onRename={() => { setEditingId(cat?.id ?? item.name); setEditName(item.name); }}
                            onColor={(c) => cat && setColor.mutate({ id: cat.id, color: c })}
                            onDelete={() => {
                              if (!cat) return;
                              if (confirm(`Remover categoria "${item.name}"? Os documentos ficarão "Sem categoria".`)) {
                                remove.mutate({ id: cat.id, name: item.name });
                              }
                            }}
                            onMoveUp={() => moveCat(dbIdx, -1)}
                            onMoveDown={() => moveCat(dbIdx, 1)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* EMPRESAS — agrupador opcional */}
        {companies.length > 0 && (
          <div className="space-y-1">
            <button onClick={() => setCompaniesOpen(o => !o)}
              className="w-full flex items-center justify-between px-1.5 group">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground flex items-center gap-1">
                {companiesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Building2 className="h-3 w-3" />
                Empresas
                <span className="ml-1 text-muted-foreground/70 normal-case font-mono">({companies.length})</span>
              </span>
            </button>
            {companiesOpen && (
              <div className="space-y-0.5">
                {companies.map(c => {
                  const active = selectedCompany === c.id;
                  return (
                    <button key={c.id} onClick={() => setSelectedCompany(active ? "all" : c.id)} title={c.name}
                      className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all ${
                        active ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "hover:bg-secondary/60 text-foreground/90"
                      }`}
                    >
                      {c.logo_url ? <img src={c.logo_url} alt="" className="h-4 w-4 rounded-sm shrink-0" />
                        : <Building2 className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />}
                      <span className="text-[12px] leading-tight flex-1 break-words">{c.name}</span>
                      <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-full ${
                        active ? "bg-primary/15 text-primary" : "bg-secondary/70 text-muted-foreground"
                      }`}>{countByCompany(c.id)}</span>
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

function CategoryActions({
  item, canReorder, canMoveUp, canMoveDown,
  onRename, onColor, onDelete, onMoveUp, onMoveDown,
}: {
  item: { name: string; cat?: DocCategory };
  canReorder: boolean; canMoveUp: boolean; canMoveDown: boolean;
  onRename: () => void;
  onColor: (c: string | null) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-1 text-muted-foreground hover:text-foreground rounded" title="Opções">
          <MoreVertical className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-52 p-1.5">
        <button onClick={() => { onRename(); setOpen(false); }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary text-foreground">
          <Pencil className="h-3.5 w-3.5" /> Renomear
        </button>

        {canReorder && (
          <>
            <button onClick={() => { onMoveUp(); setOpen(false); }} disabled={!canMoveUp}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary text-foreground disabled:opacity-40 disabled:cursor-not-allowed">
              <ArrowUp className="h-3.5 w-3.5" /> Mover para cima
            </button>
            <button onClick={() => { onMoveDown(); setOpen(false); }} disabled={!canMoveDown}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary text-foreground disabled:opacity-40 disabled:cursor-not-allowed">
              <ArrowDown className="h-3.5 w-3.5" /> Mover para baixo
            </button>
          </>
        )}

        {item.cat && (
          <>
            <div className="border-t border-border/60 my-1" />
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Palette className="h-3 w-3" /> Cor
            </div>
            <div className="grid grid-cols-4 gap-1 px-1.5 pb-1">
              {COLOR_PRESETS.map(c => (
                <button key={c.name} title={c.name}
                  onClick={() => { onColor(c.value); setOpen(false); }}
                  className="h-6 w-6 rounded-md border border-border hover:scale-110 transition-transform flex items-center justify-center"
                  style={{ backgroundColor: c.swatch + "33", color: c.swatch }}
                >
                  <TagIcon className="h-3 w-3" />
                </button>
              ))}
            </div>
            <div className="border-t border-border/60 my-1" />
            <button onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-destructive/10 text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Remover categoria
            </button>
          </>
        )}

        {!item.cat && (
          <p className="text-[10px] text-muted-foreground italic px-2 py-1.5">
            Categoria vinda de documentos antigos. Renomeie para registrá-la.
          </p>
        )}
      </PopoverContent>
    </Popover>
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
    <button onClick={onClick}
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
