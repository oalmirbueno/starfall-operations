import { useState } from "react";
import { useIdeas, IdeaRow, IdeaInput } from "@/hooks/useIdeas";
import { StatusBadge } from "@/components/StatusBadge";
import { Lightbulb, Plus, Edit, Trash2, Search, StickyNote, CheckCircle, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  nova: { label: "Nova", color: "bg-blue-500/10 text-blue-400", icon: Sparkles },
  trabalhando: { label: "Trabalhando", color: "bg-amber-500/10 text-amber-400", icon: Loader2 },
  usada: { label: "Usada", color: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle },
  descartada: { label: "Descartada", color: "bg-muted text-muted-foreground", icon: X },
};

const defaultForm: IdeaInput = { title: "", content: "", status: "nova", priority: "media", tags: [] };

export default function Ideas() {
  const { ideas, isLoading, create, update, remove } = useIdeas();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<IdeaRow | null>(null);
  const [form, setForm] = useState<IdeaInput>(defaultForm);
  const [tagInput, setTagInput] = useState("");

  const filtered = ideas.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || (i.content ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    nova: ideas.filter(i => i.status === "nova").length,
    trabalhando: ideas.filter(i => i.status === "trabalhando").length,
    usada: ideas.filter(i => i.status === "usada").length,
    descartada: ideas.filter(i => i.status === "descartada").length,
  };

  const openCreate = () => { setEditing(null); setForm(defaultForm); setTagInput(""); setFormOpen(true); };
  const openEdit = (item: IdeaRow) => {
    setEditing(item);
    setForm({ title: item.title, content: item.content ?? "", status: item.status, priority: item.priority, tags: item.tags ?? [] });
    setTagInput("");
    setFormOpen(true);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { setForm(f => ({ ...f, tags: [...f.tags, t] })); setTagInput(""); }
  };

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    if (editing) { await update.mutateAsync({ id: editing.id, ...form }); }
    else { await create.mutateAsync(form); }
    setFormOpen(false);
  };

  const quickStatus = async (id: string, status: string) => {
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;
    await update.mutateAsync({ id, title: idea.title, content: idea.content ?? "", status, priority: idea.priority, tags: idea.tags ?? [] });
  };

  if (isLoading) return (
    <div className="space-y-5 animate-fade-in">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Bloco de Ideias</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Capture, organize e acompanhe suas ideias</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Nova Ideia</Button>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["nova", "trabalhando", "usada", "descartada"] as const).map(s => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`bg-card border rounded-lg p-3 text-left transition-all ${statusFilter === s ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
              <div className="flex items-center justify-between">
                <Icon className={`h-4 w-4 ${cfg.color.split(" ")[1]}`} />
                <span className="text-xl font-bold text-foreground">{counts[s]}</span>
              </div>
              <span className="text-[11px] text-muted-foreground mt-1">{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ideias..." className="bg-secondary/40 pl-9" />
      </div>

      {/* Ideas grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <StickyNote className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-foreground">Nenhuma ideia encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">Comece adicionando suas primeiras ideias</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 canvas-stagger">
          {filtered.map(idea => {
            const cfg = statusConfig[idea.status] ?? statusConfig.nova;
            const Icon = cfg.icon;
            return (
              <div key={idea.id} className="bg-card border border-border rounded-lg p-4 card-hover group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-md ${cfg.color.split(" ")[0]}`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color.split(" ")[1]}`} />
                    </div>
                    <h3 className="text-[13px] font-medium text-foreground truncate">{idea.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(idea)} className="text-muted-foreground hover:text-primary p-1"><Edit className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteConfirm(idea.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {idea.content && <p className="text-[11px] text-muted-foreground line-clamp-3 mb-2">{idea.content}</p>}

                {/* Tags */}
                {idea.tags && idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {idea.tags.map(t => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={cfg.label} />
                    <StatusBadge status={idea.priority} />
                  </div>
                  {/* Quick status buttons */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {idea.status !== "trabalhando" && (
                      <button onClick={() => quickStatus(idea.id, "trabalhando")} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">▶</button>
                    )}
                    {idea.status !== "usada" && (
                      <button onClick={() => quickStatus(idea.id, "usada")} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">✓</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir ideia</DialogTitle><DialogDescription>Esta ação é irreversível.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleteConfirm) { await remove.mutateAsync(deleteConfirm); setDeleteConfirm(null); } }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Ideia" : "Nova Ideia"}</DialogTitle>
            <DialogDescription>Registre e organize suas ideias rapidamente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs">Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary/50" placeholder="Ex: Automação de deploy com N8N" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Descrição</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="bg-secondary/50 min-h-[100px]" placeholder="Descreva sua ideia em detalhes..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nova">Nova</SelectItem>
                    <SelectItem value="trabalhando">Trabalhando</SelectItem>
                    <SelectItem value="usada">Usada</SelectItem>
                    <SelectItem value="descartada">Descartada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs">Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Adicionar tag..." className="bg-secondary/50 flex-1" />
                <Button type="button" size="sm" variant="outline" onClick={addTag}>+</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground flex items-center gap-1">
                      {t} <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
