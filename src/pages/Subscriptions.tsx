import { useState } from "react";
import { useSubscriptions, SubscriptionRow } from "@/hooks/useSubscriptions";
import { useAlerts } from "@/hooks/useAlerts";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Filter, Plus, Edit, Trash2, Check, CircleDollarSign, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const defaultForm = {
  provider: "", account: "", plan: "", value: 0, currency: "BRL",
  cycle: "mensal", next_renewal: "", auto_renew: true, status: "ativo",
  responsible: "", notes: "", tags: [] as string[], category: "",
};

function getNextRenewal(current: string, cycle: string): string {
  const d = new Date(current);
  if (cycle === "anual") d.setFullYear(d.getFullYear() + 1);
  else if (cycle === "trimestral") d.setMonth(d.getMonth() + 3);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

/** Normaliza valor mensal independente do ciclo */
function monthlyValue(s: SubscriptionRow): number {
  const v = Number(s.value);
  if (s.cycle === "anual") return v / 12;
  if (s.cycle === "trimestral") return v / 3;
  return v;
}

export default function Subscriptions() {
  const { subscriptions, isLoading, create, update, remove } = useSubscriptions();
  const { computeAlerts } = useAlerts();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<SubscriptionRow | null>(null);
  const [form, setForm] = useState(defaultForm);

  const categories = ["all", ...Array.from(new Set(subscriptions.map(s => s.category).filter(Boolean)))];

  const activeSubscriptions = subscriptions.filter(s => s.status === "ativo");

  // Cost calculations
  const totalMensal = activeSubscriptions.reduce((sum, s) => sum + monthlyValue(s), 0);
  const totalPago = activeSubscriptions
    .filter(s => (s as any).payment_status === "pago")
    .reduce((sum, s) => sum + monthlyValue(s), 0);
  const totalPendente = activeSubscriptions
    .filter(s => (s as any).payment_status !== "pago")
    .reduce((sum, s) => sum + monthlyValue(s), 0);
  const pendingCount = activeSubscriptions.filter(s => (s as any).payment_status !== "pago").length;
  const paidCount = activeSubscriptions.filter(s => (s as any).payment_status === "pago").length;

  const filtered = subscriptions.filter(s => {
    const matchSearch = s.provider.toLowerCase().includes(search.toLowerCase()) || (s.account ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
    const ps = (s as any).payment_status ?? "pendente";
    const matchPayment = paymentFilter === "all" || ps === paymentFilter;
    return matchSearch && matchCategory && matchPayment;
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
      ...form, value: form.value,
      next_renewal: form.next_renewal || null, account: form.account || null,
      plan: form.plan || null, responsible: form.responsible || null,
      notes: form.notes || null, category: form.category || null,
    };
    if (editing) await update.mutateAsync({ id: editing.id, ...payload });
    else await create.mutateAsync(payload);
    setFormOpen(false);
    // Recalculate alerts after any change
    setTimeout(() => computeAlerts.mutate(), 500);
  };

  const markPaid = async (s: SubscriptionRow) => {
    const nextDate = s.next_renewal ? getNextRenewal(s.next_renewal, s.cycle) : null;
    await update.mutateAsync({
      id: s.id,
      payment_status: "pago",
      last_paid_at: new Date().toISOString(),
      ...(nextDate ? { next_renewal: nextDate } : {}),
    } as any);
    toast.success(`${s.provider} pago — renovação avançada para ${nextDate ?? "próximo ciclo"}`);
    // Recalculate alerts since renewal date changed
    setTimeout(() => computeAlerts.mutate(), 500);
  };

  const markUnpaid = async (s: SubscriptionRow) => {
    await update.mutateAsync({
      id: s.id,
      payment_status: "pendente",
    } as any);
    toast.info(`${s.provider} marcado como pendente`);
  };

  if (isLoading) return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-6 w-40" /><Skeleton className="h-10 w-full" /><Skeleton className="h-96 rounded-lg" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Assinaturas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão completa de assinaturas e serviços recorrentes</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nova Assinatura</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button onClick={() => setPaymentFilter("all")}
          className={`bg-card border rounded-lg p-3 text-left transition-all ${paymentFilter === "all" ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
          <div className="flex items-center gap-1.5 mb-1"><DollarSign className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Mensal</span></div>
          <div className="text-lg font-bold text-foreground font-mono">R$ {totalMensal.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">{activeSubscriptions.length} assinaturas ativas</div>
        </button>

        <button onClick={() => setPaymentFilter(paymentFilter === "pago" ? "all" : "pago")}
          className={`bg-card border rounded-lg p-3 text-left transition-all ${paymentFilter === "pago" ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
          <div className="flex items-center gap-1.5 mb-1"><Check className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Já Pago</span></div>
          <div className="text-lg font-bold text-primary font-mono">R$ {totalPago.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">{paidCount} pagas</div>
        </button>

        <button onClick={() => setPaymentFilter(paymentFilter === "pendente" ? "all" : "pendente")}
          className={`bg-card border rounded-lg p-3 text-left transition-all ${paymentFilter === "pendente" ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
          <div className="flex items-center gap-1.5 mb-1"><CircleDollarSign className="h-3.5 w-3.5 text-destructive" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendente</span></div>
          <div className="text-lg font-bold text-destructive font-mono">R$ {totalPendente.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">{pendingCount} a pagar</div>
        </button>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Progresso do Mês</div>
          <div className="text-lg font-bold text-foreground">{totalMensal > 0 ? Math.round((totalPago / totalMensal) * 100) : 0}%</div>
          <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${totalMensal > 0 ? (totalPago / totalMensal) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Projeção Anual</div>
          <div className="text-lg font-bold text-foreground font-mono">R$ {(totalMensal * 12).toFixed(0)}</div>
          <div className="text-[10px] text-muted-foreground">12 meses</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
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

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4"><Plus className="h-6 w-6 text-muted-foreground/50" /></div>
          <h3 className="text-sm font-medium text-foreground mb-1">Nenhuma assinatura</h3>
          <p className="text-xs text-muted-foreground mb-4">Adicione suas assinaturas para monitorar custos</p>
          <Button onClick={openCreate} size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Adicionar</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 label-sm">Provider</th>
                  <th className="text-left px-4 py-3 label-sm">Plano</th>
                  <th className="text-right px-4 py-3 label-sm">Valor</th>
                  <th className="text-left px-4 py-3 label-sm">Ciclo</th>
                  <th className="text-left px-4 py-3 label-sm">Renovação</th>
                  <th className="text-center px-4 py-3 label-sm">Pagamento</th>
                  <th className="text-left px-4 py-3 label-sm">Status</th>
                  <th className="text-right px-4 py-3 label-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const ps = (s as any).payment_status ?? "pendente";
                  const isPaid = ps === "pago";
                  return (
                    <tr key={s.id} className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${!isPaid && s.status === "ativo" ? "bg-destructive/[0.02]" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{s.provider}</div>
                        {s.account && <div className="text-[10px] text-muted-foreground font-mono">{s.account}</div>}
                      </td>
                      <td className="px-4 py-3 text-foreground">{s.plan ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">{s.currency} {Number(s.value).toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.cycle}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.next_renewal ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {isPaid ? (
                          <button onClick={() => markUnpaid(s)}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Clique para desfazer">
                            <Check className="h-3 w-3" /> Pago
                          </button>
                        ) : (
                          <button onClick={() => markPaid(s)}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                            <CircleDollarSign className="h-3 w-3" /> Pagar
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(s)} className="text-muted-foreground hover:text-primary p-1"><Edit className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDeleteConfirm(s.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr className="bg-secondary/20 border-t border-border">
                  <td colSpan={2} className="px-4 py-2 text-xs font-medium text-foreground">
                    {paymentFilter === "pago" ? "Total Pago" : paymentFilter === "pendente" ? "Total Pendente" : "Total Mensal"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-foreground text-sm">
                    R$ {filtered.filter(s => s.status === "ativo").reduce((sum, s) => sum + monthlyValue(s), 0).toFixed(2)}
                  </td>
                  <td colSpan={5} className="px-4 py-2 text-xs text-muted-foreground">
                    {filtered.length} {filtered.length === 1 ? "item" : "itens"} exibidos
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-destructive">Eliminar Assinatura</DialogTitle><DialogDescription>Esta ação é irreversível.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleteConfirm) { await remove.mutateAsync(deleteConfirm); setDeleteConfirm(null); setTimeout(() => computeAlerts.mutate(), 500); } }}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={o => { if (!o) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Assinatura" : "Nova Assinatura"}</DialogTitle><DialogDescription>Preencha os dados.</DialogDescription></DialogHeader>
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
