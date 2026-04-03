import { useState } from "react";
import { useSubscriptions, SubscriptionRow } from "@/hooks/useSubscriptions";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Filter, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

const defaultForm = {
  provider: "", account: "", plan: "", value: 0, currency: "USD",
  cycle: "mensal", next_renewal: "", auto_renew: true, status: "ativo",
  responsible: "", notes: "", tags: [] as string[], category: "",
};

export default function Subscriptions() {
  const { subscriptions, isLoading, create, update, remove } = useSubscriptions();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<SubscriptionRow | null>(null);
  const [form, setForm] = useState(defaultForm);

  const categories = ["all", ...Array.from(new Set(subscriptions.map(s => s.category).filter(Boolean)))];
  const filtered = subscriptions.filter(s => {
    const matchSearch = s.provider.toLowerCase().includes(search.toLowerCase()) || (s.account ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const openCreate = () => { setEditing(null); setForm(defaultForm); setFormOpen(true); };
  const openEdit = (s: SubscriptionRow) => {
    setEditing(s);
    setForm({
      provider: s.provider, account: s.account ?? "", plan: s.plan ?? "",
      value: Number(s.value), currency: s.currency, cycle: s.cycle,
      next_renewal: s.next_renewal ?? "", auto_renew: s.auto_renew,
      status: s.status, responsible: s.responsible ?? "", notes: s.notes ?? "",
      tags: s.tags ?? [], category: s.category ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.provider) return;
    const payload = {
      ...form,
      value: form.value,
      next_renewal: form.next_renewal || null,
      account: form.account || null,
      plan: form.plan || null,
      responsible: form.responsible || null,
      notes: form.notes || null,
      category: form.category || null,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    setFormOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Assinaturas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão completa de assinaturas e serviços recorrentes</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nova Assinatura
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar provider ou conta..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c as string)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {c === "all" ? "Todos" : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">Nenhuma assinatura registada</h3>
          <p className="text-xs text-muted-foreground mb-4">Adicione suas assinaturas para monitorar custos e vencimentos</p>
          <Button onClick={openCreate} size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Adicionar</Button>
        </div>
      ) : (
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
                  <th className="text-right px-4 py-3 label-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{s.provider}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.account ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground">{s.plan ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{s.currency} {Number(s.value).toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.cycle}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.next_renewal ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${s.auto_renew ? "bg-primary" : "bg-destructive"}`} />
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{s.responsible || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="text-muted-foreground hover:text-primary p-1"><Edit className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteConfirm(s.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Assinatura</DialogTitle>
            <DialogDescription>Esta ação é irreversível. Os alertas associados também serão removidos.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleteConfirm) { await remove.mutateAsync(deleteConfirm); setDeleteConfirm(null); } }}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={o => { if (!o) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Assinatura" : "Nova Assinatura"}</DialogTitle>
            <DialogDescription>Preencha os dados da assinatura.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Provider *</Label><Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Conta</Label><Input value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Plano</Label><Input value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Valor *</Label><Input type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Moeda</Label><Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ciclo</Label>
                <Select value={form.cycle} onValueChange={v => setForm(f => ({ ...f, cycle: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Próxima Renovação</Label><Input type="date" value={form.next_renewal} onChange={e => setForm(f => ({ ...f, next_renewal: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch checked={form.auto_renew} onCheckedChange={v => setForm(f => ({ ...f, auto_renew: v }))} />
                <Label className="text-xs">Auto-renovação</Label>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-secondary/50 min-h-[60px]" /></div>
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
