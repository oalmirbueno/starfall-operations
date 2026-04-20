import { useState } from "react";
import { useInfrastructure, InfrastructureAssetInput, InfrastructureAssetRow } from "@/hooks/useInfrastructure";
import { StatusBadge } from "@/components/StatusBadge";
import { Server, Cpu, HardDrive, Plus, Edit, Trash2, Search, Activity, Calendar, DollarSign, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const typeIcons: Record<string, any> = {
  EC2: Cpu, RDS: HardDrive, S3: HardDrive, Droplet: Server, VPS: Server, GKE: Cpu,
};

const defaultForm: InfrastructureAssetInput = {
  provider_name: "", account_name: "", name: "", asset_type: "VPS", status: "online",
  region: "", ip_address: "", renewal_date: "", monthly_cost: 0, usage_summary: "", responsible: "", notes: "",
};

type SortKey = "renewal" | "cost" | "status" | "name";
type SortDir = "asc" | "desc";

const statusOrder: Record<string, number> = { online: 0, "manutenção": 1, offline: 2, decommissioned: 3 };

export default function Infrastructure() {
  const { infrastructure, isLoading, create, update, remove } = useInfrastructure();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("renewal");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<InfrastructureAssetRow | null>(null);
  const [form, setForm] = useState<InfrastructureAssetInput>(defaultForm);

  const filtered = infrastructure.filter(item => {
    const haystack = [item.name, item.asset_type, item.provider_name, item.region, item.ip_address, item.payment_status].join(" ").toLowerCase();
    const matchSearch = haystack.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "renewal") {
      const da = a.effective_renewal_date ? new Date(a.effective_renewal_date).getTime() : Infinity;
      const db = b.effective_renewal_date ? new Date(b.effective_renewal_date).getTime() : Infinity;
      return (da - db) * dir;
    }
    if (sortKey === "cost") return (Number(a.effective_monthly_cost ?? a.monthly_cost) - Number(b.effective_monthly_cost ?? b.monthly_cost)) * dir;
    if (sortKey === "status") return ((statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)) * dir;
    return a.name.localeCompare(b.name) * dir;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const sortIcon = (key: SortKey) => sortKey !== key
    ? <ArrowUpDown className="h-3 w-3 opacity-40" />
    : sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;

  const totalCost = infrastructure.filter(i => i.status !== "decommissioned").reduce((s, i) => s + Number(i.effective_monthly_cost ?? i.monthly_cost), 0);
  const onlineCount = infrastructure.filter(i => i.status === "online").length;
  const nextRenewal = infrastructure
    .filter(i => i.effective_renewal_date)
    .sort((a, b) => (a.effective_renewal_date ?? "").localeCompare(b.effective_renewal_date ?? ""))[0];

  const openCreate = () => { setEditing(null); setForm(defaultForm); setFormOpen(true); };
  const openEdit = (item: InfrastructureAssetRow) => {
    setEditing(item);
    setForm({
      provider_name: item.provider_name ?? "", account_name: item.account_name ?? "",
      name: item.name, asset_type: item.asset_type, status: item.status,
      region: item.region ?? "", ip_address: item.ip_address ?? "",
      renewal_date: item.renewal_date ?? "", monthly_cost: Number(item.monthly_cost),
      usage_summary: item.usage_summary ?? "", responsible: item.responsible ?? "", notes: item.notes ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.provider_name.trim()) return;
    if (editing) await update.mutateAsync({ id: editing.id, ...form });
    else await create.mutateAsync(form);
    setFormOpen(false);
  };

  if (isLoading) return (
    <div className="space-y-5 animate-fade-in">
      <Skeleton className="h-8 w-40" /><Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Infraestrutura</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Visualização organizada dos recursos vinculados às assinaturas</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Novo Recurso</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1"><DollarSign className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Custo Mensal</span></div>
          <div className="text-lg font-bold text-foreground font-mono">R$ {totalCost.toFixed(2)}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1"><Activity className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Online</span></div>
          <div className="text-lg font-bold text-foreground">{onlineCount} <span className="text-sm text-muted-foreground">/ {infrastructure.length}</span></div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1"><Server className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Ativos</span></div>
          <div className="text-lg font-bold text-foreground">{infrastructure.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1"><Calendar className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Próx. Renovação</span></div>
          <div className="text-sm font-mono text-foreground">{nextRenewal?.effective_renewal_date ?? "—"}</div>
          {nextRenewal && <div className="text-[10px] text-muted-foreground">{nextRenewal.name}</div>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar recurso..." className="bg-secondary/40 pl-9" />
          </div>
          <div className="flex gap-1">
            {["all", "online", "offline", "manutenção"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {s === "all" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ordenar por:</span>
          {([
            { key: "renewal" as SortKey, label: "Renovação" },
            { key: "cost" as SortKey, label: "Custo" },
            { key: "status" as SortKey, label: "Status" },
            { key: "name" as SortKey, label: "Nome" },
          ]).map(opt => (
            <button key={opt.key} onClick={() => toggleSort(opt.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${sortKey === opt.key ? "bg-primary/10 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"}`}>
              {opt.label} {sortIcon(opt.key)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <Server className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-foreground">Nenhum recurso encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 canvas-stagger">
          {filtered.map(r => {
            const TypeIcon = typeIcons[r.asset_type] || Server;
            const renewalDate = r.effective_renewal_date ?? r.renewal_date;
            const monthlyCost = Number(r.effective_monthly_cost ?? r.monthly_cost);
            const daysUntil = renewalDate ? Math.ceil((new Date(renewalDate).getTime() - Date.now()) / 86400000) : null;
            const isPaid = r.payment_status === "pago";
            return (
              <div key={r.id} className={`bg-card border rounded-lg p-4 card-hover group ${daysUntil !== null && daysUntil <= 7 ? "border-destructive/40" : "border-border"}`}>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-md ${r.status === "online" ? "bg-primary/10" : "bg-muted"}`}>
                      <TypeIcon className={`h-3.5 w-3.5 ${r.status === "online" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[13px] font-medium text-foreground block truncate">{r.name}</span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">{r.asset_type}</span>
                        {r.linked_subscription_id && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${isPaid ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                            {isPaid ? <CheckCircle2 className="h-3 w-3" /> : <CircleDollarSign className="h-3 w-3" />}
                            {isPaid ? "Pago" : "Pendente"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openEdit(r)} className="text-muted-foreground hover:text-primary p-1"><Edit className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteConfirm(r.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Provider</span><span className="text-foreground text-right">{r.provider_name ?? "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Região</span><span className="text-foreground font-mono text-[10px] text-right">{r.region ?? "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">IP</span><span className="text-foreground font-mono text-[10px] text-right">{r.ip_address ?? "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Uso</span><span className="text-primary font-mono text-right">{r.usage_summary ?? "—"}</span></div>
                  {renewalDate && (
                    <div className="col-span-2 flex justify-between gap-3">
                      <span className="text-muted-foreground">Renovação</span>
                      <span className={`font-mono text-[10px] text-right ${daysUntil !== null && daysUntil <= 7 ? "text-destructive font-medium" : "text-foreground"}`}>
                        {renewalDate} {daysUntil !== null && `(${daysUntil}d)`}
                      </span>
                    </div>
                  )}
                  {r.last_paid_at && (
                    <div className="col-span-2 flex justify-between gap-3">
                      <span className="text-muted-foreground">Últ. pagamento</span>
                      <span className="text-foreground font-mono text-[10px] text-right">{new Date(r.last_paid_at).toISOString().slice(0, 10)}</span>
                    </div>
                  )}
                  {r.responsible && (
                    <div className="col-span-2 flex justify-between gap-3">
                      <span className="text-muted-foreground">Responsável</span><span className="text-foreground text-right">{r.responsible}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40 gap-3">
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{r.linked_subscription_id ? "Sincronizado com assinatura" : (r.notes ?? r.account_name ?? "")}</span>
                  <span className="font-mono text-[12px] text-foreground font-medium whitespace-nowrap">R$ {monthlyCost.toFixed(2)}<span className="text-muted-foreground text-[10px]">/mês</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir recurso</DialogTitle><DialogDescription>Ação irreversível.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleteConfirm) { await remove.mutateAsync(deleteConfirm); setDeleteConfirm(null); } }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar recurso" : "Novo recurso"}</DialogTitle><DialogDescription>Infra real conectada.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Provider *</Label><Input value={form.provider_name} onChange={e => setForm(f => ({ ...f, provider_name: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Conta</Label><Input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={form.asset_type} onValueChange={v => setForm(f => ({ ...f, asset_type: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{['VPS','EC2','RDS','S3','Droplet','GKE','CDN','DNS','LoadBalancer'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Região</Label><Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">IP</Label><Input value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Custo R$/mês</Label><Input type="number" step="0.01" value={form.monthly_cost} onChange={e => setForm(f => ({ ...f, monthly_cost: Number(e.target.value) }))} className="bg-secondary/50" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Renovação</Label><Input type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Uso</Label><Input value={form.usage_summary} onChange={e => setForm(f => ({ ...f, usage_summary: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="offline">Offline</SelectItem><SelectItem value="manutenção">Manutenção</SelectItem><SelectItem value="decommissioned">Desativado</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} className="bg-secondary/50" /></div>
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
