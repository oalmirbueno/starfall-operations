import { useState } from "react";
import { useOpportunities, OpportunityInput, OpportunityRow } from "@/hooks/useOpportunities";
import { StatusBadge } from "@/components/StatusBadge";
import { Lightbulb, ArrowUpRight, Plus, Edit, Trash2 } from "lucide-react";
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
  title: "",
  tool: "",
  category: "",
  reason: "",
  status: "a_avaliar",
  estimated_cost: 0,
  expected_benefit: "",
  priority: "media",
  notes: "",
  responsible: "",
};

export default function Opportunities() {
  const { opportunities, isLoading, create, update, remove } = useOpportunities();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<OpportunityRow | null>(null);
  const [form, setForm] = useState<OpportunityInput>(defaultForm);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormOpen(true);
  };

  const openEdit = (item: OpportunityRow) => {
    setEditing(item);
    setForm({
      title: item.title,
      tool: item.tool ?? "",
      category: item.category ?? "",
      reason: item.reason,
      status: item.status,
      estimated_cost: Number(item.estimated_cost),
      expected_benefit: item.expected_benefit ?? "",
      priority: item.priority,
      notes: item.notes ?? "",
      responsible: item.responsible ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.reason.trim()) return;
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...form });
    } else {
      await create.mutateAsync(form);
    }
    setFormOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-56 rounded-lg" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Oportunidades</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Ferramentas, serviços e melhorias a avaliar</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Nova Oportunidade</Button>
      </div>

      {opportunities.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-foreground">Nenhuma oportunidade cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione análises reais para o pipeline de contratação.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 canvas-stagger">
        {opportunities.map(o => (
          <div key={o.id} className="bg-card border border-border rounded-lg p-4 card-hover cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/8 group-hover:bg-primary/12 transition-colors">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[13px] font-medium text-foreground">{o.tool || o.title}</span>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(o)} className="text-muted-foreground hover:text-primary p-1"><Edit className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteConfirm(o.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                <StatusBadge status={o.priority} />
              </div>
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
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir oportunidade</DialogTitle>
            <DialogDescription>Esta ação remove a oportunidade da base real.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleteConfirm) { await remove.mutateAsync(deleteConfirm); setDeleteConfirm(null); } }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle>
            <DialogDescription>Registro persistido no banco com status e prioridade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Título *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Ferramenta</Label><Input value={form.tool} onChange={(e) => setForm((f) => ({ ...f, tool: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Categoria</Label><Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Responsável</Label><Input value={form.responsible} onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Motivo *</Label><Textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="bg-secondary/50 min-h-[70px]" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Custo estimado</Label><Input type="number" step="0.01" value={form.estimated_cost} onChange={(e) => setForm((f) => ({ ...f, estimated_cost: Number(e.target.value) }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((f) => ({ ...f, status: value }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_avaliar">A avaliar</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="contratar">Contratar</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prioridade</Label>
                <Select value={form.priority} onValueChange={(value) => setForm((f) => ({ ...f, priority: value }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Benefício esperado</Label><Textarea value={form.expected_benefit} onChange={(e) => setForm((f) => ({ ...f, expected_benefit: e.target.value }))} className="bg-secondary/50 min-h-[60px]" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Observações</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="bg-secondary/50 min-h-[60px]" /></div>
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
