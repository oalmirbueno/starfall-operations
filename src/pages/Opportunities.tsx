import { useState } from "react";
import { useOpportunities, OpportunityInput, OpportunityRow } from "@/hooks/useOpportunities";
import { StatusBadge } from "@/components/StatusBadge";
import { Lightbulb, Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels: Record<string, string> = {
  a_avaliar: "A avaliar", pendente: "Pendente", contratar: "Contratar", descartado: "Descartado", ativo: "Ativo",
};

const defaultForm: OpportunityInput = {
  title: "", tool: "", category: "", reason: "", status: "a_avaliar",
  estimated_cost: 0, expected_benefit: "", priority: "media", notes: "", responsible: "",
};

export default function Opportunities() {
  const { opportunities, isLoading, create, update, remove } = useOpportunities();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<OpportunityRow | null>(null);
  const [form, setForm] = useState<OpportunityInput>(defaultForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = opportunities.filter(o => {
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase()) || (o.tool ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setEditing(null); setForm(defaultForm); setFormOpen(true); };
  const openEdit = (item: OpportunityRow) => {
    setEditing(item);
    setForm({
      title: item.title, tool: item.tool ?? "", category: item.category ?? "",
      reason: item.reason, status: item.status, estimated_cost: Number(item.estimated_cost),
      expected_benefit: item.expected_benefit ?? "", priority: item.priority,
      notes: item.notes ?? "", responsible: item.responsible ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    if (editing) await update.mutateAsync({ id: editing.id, ...form });
    else await create.mutateAsync({ ...form, reason: form.reason || form.title });
    setFormOpen(false);
  };

  const quickStatus = async (id: string, status: string) => {
    const o = opportunities.find(i => i.id === id);
    if (!o) return;
    await update.mutateAsync({ id, title: o.title, tool: o.tool ?? "", category: o.category ?? "", reason: o.reason, status, estimated_cost: Number(o.estimated_cost), expected_benefit: o.expected_benefit ?? "", priority: o.priority, notes: o.notes ?? "", responsible: o.responsible ?? "" });
  };

  if (isLoading) return (
    <div className="space-y-5 animate-fade-in">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-56 rounded-lg" />)}</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Oportunidades</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Pipeline de ferramentas e serviços a avaliar</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Adicionar</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="bg-secondary/40 pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "a_avaliar", "pendente", "contratar", "ativo", "descartado"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "Todos" : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-foreground">Nenhuma oportunidade</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione ferramentas para o pipeline de contratação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 canvas-stagger">
          {filtered.map(o => (
            <div key={o.id} className="bg-card border border-border rounded-lg p-4 card-hover group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-[13px] font-medium text-foreground truncate">{o.tool || o.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(o)} className="text-muted-foreground hover:text-primary p-1"><Edit className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(o.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mb-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span className="text-foreground">{o.category || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Custo</span><span className="font-mono text-foreground">R${o.estimated_cost}/mês</span></div>
              </div>

              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{o.reason}</p>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="flex gap-1.5">
                  <StatusBadge status={statusLabels[o.status]} />
                  <StatusBadge status={o.priority} />
                </div>
                {/* Quick actions */}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {o.status !== "contratar" && (
                    <button onClick={() => quickStatus(o.id, "contratar")} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">Contratar</button>
                  )}
                  {o.status !== "descartado" && (
                    <button onClick={() => quickStatus(o.id, "descartado")} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80">Descartar</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir oportunidade</DialogTitle><DialogDescription>Ação irreversível.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleteConfirm) { await remove.mutateAsync(deleteConfirm); setDeleteConfirm(null); } }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simplified form - fewer required fields for speed */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nova Oportunidade"}</DialogTitle>
            <DialogDescription>Rápido e direto ao ponto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label className="text-xs">Título / Ferramenta *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary/50" placeholder="Ex: Notion, Slack Pro..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Custo R$/mês</Label><Input type="number" value={form.estimated_cost} onChange={e => setForm(f => ({ ...f, estimated_cost: Number(e.target.value) }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="bg-secondary/50" placeholder="IA, Marketing..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="alta">Alta</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="baixa">Baixa</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="a_avaliar">A avaliar</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="contratar">Contratar</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="descartado">Descartado</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Motivo / Notas</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="bg-secondary/50 min-h-[60px]" placeholder="Por que considerar?" /></div>
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
