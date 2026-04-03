import { useState } from "react";
import { useCredentials, Credential } from "@/hooks/useCredentials";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Copy, ShieldCheck, ShieldAlert, Plus, Trash2, Edit, Lock, Unlock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export default function Credentials() {
  const { credentials, isLoading, create, update, remove, logReveal, logCopy } = useCredentials();
  const { user } = useAuth();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [confirmReveal, setConfirmReveal] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<Credential | null>(null);

  // Form state
  const [provider, setProvider] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState("");
  const [owner, setOwner] = useState("");
  const [has2FA, setHas2FA] = useState(false);
  const [recoveryInfo, setRecoveryInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [classification, setClassification] = useState("operational");
  const [securityNotes, setSecurityNotes] = useState("");

  const resetForm = () => {
    setProvider(""); setLogin(""); setPassword(""); setAccount("");
    setOwner(""); setHas2FA(false); setRecoveryInfo(""); setNotes("");
    setClassification("operational"); setSecurityNotes(""); setEditing(null);
  };

  const openEdit = (c: Credential) => {
    setEditing(c); setProvider(c.provider); setLogin(c.login);
    setPassword(c.password_encrypted); setAccount(c.account ?? "");
    setOwner(c.owner ?? ""); setHas2FA(c.has_2fa);
    setRecoveryInfo(c.recovery_info ?? ""); setNotes(c.notes ?? "");
    setClassification(c.classification); setSecurityNotes(c.security_notes ?? "");
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!provider || !login || !password) { toast.error("Preencha os campos obrigatórios"); return; }
    const payload = {
      provider, login, password_encrypted: password,
      account: account || null, owner: owner || null, has_2fa: has2FA,
      recovery_info: recoveryInfo || null, notes: notes || null,
      classification, security_notes: securityNotes || null,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    setFormOpen(false); resetForm();
  };

  const handleRevealRequest = (id: string) => setConfirmReveal(id);
  const handleRevealConfirm = async () => {
    if (!confirmReveal) return;
    const cred = credentials.find(c => c.id === confirmReveal);
    setRevealed(prev => ({ ...prev, [confirmReveal]: true }));
    if (cred) await logReveal(confirmReveal, cred.provider);
    setConfirmReveal(null);
    setTimeout(() => setRevealed(prev => ({ ...prev, [confirmReveal!]: false })), 30000);
  };

  const hidePassword = (id: string) => setRevealed(prev => ({ ...prev, [id]: false }));

  const copyToClipboard = async (text: string, id: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
    await logCopy(id, field);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-60 mt-2" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-52 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Credenciais</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão segura de acessos e credenciais</p>
        </div>
        <Button onClick={() => { resetForm(); setFormOpen(true); }} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nova Credencial
        </Button>
      </div>

      {credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Lock className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-medium text-foreground mb-1">Nenhuma credencial registada</h3>
          <p className="text-xs text-muted-foreground mb-4">Adicione suas credenciais de forma segura</p>
          <Button onClick={() => { resetForm(); setFormOpen(true); }} size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
      ) : (
        <>
          {/* Classification sections */}
          {["secret", "operational"].map(cls => {
            const filtered = credentials.filter(c => c.classification === cls);
            if (filtered.length === 0) return null;
            return (
              <div key={cls}>
                <div className="flex items-center gap-2 mb-3">
                  {cls === "secret" ? <Lock className="h-3.5 w-3.5 text-destructive" /> : <Unlock className="h-3.5 w-3.5 text-primary" />}
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {cls === "secret" ? "Dados Secretos" : "Dados Operacionais"}
                  </span>
                  <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{filtered.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {filtered.map(c => (
                    <div key={c.id} className={`bg-card border rounded-lg p-5 card-hover ${cls === "secret" ? "border-destructive/30" : "border-border"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {c.has_2fa ? <ShieldCheck className="h-4 w-4 text-primary" /> : <ShieldAlert className="h-4 w-4 text-warning" />}
                          <span className="font-medium text-foreground">{c.provider}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${c.has_2fa ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                            {c.has_2fa ? "2FA ativo" : "sem 2FA"}
                          </span>
                          <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                            <Edit className="h-3 w-3" />
                          </button>
                          <button onClick={() => setDeleteConfirm(c.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Login</span>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-mono">{c.login}</span>
                            <button onClick={() => copyToClipboard(c.login, c.id, "login")} className="text-muted-foreground hover:text-primary transition-colors"><Copy className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Senha</span>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-mono">{revealed[c.id] ? c.password_encrypted : "••••••••••"}</span>
                            <button onClick={() => revealed[c.id] ? hidePassword(c.id) : handleRevealRequest(c.id)} className="text-muted-foreground hover:text-primary transition-colors">
                              {revealed[c.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                            <button onClick={() => copyToClipboard(c.password_encrypted, c.id, "password")} className="text-muted-foreground hover:text-primary transition-colors"><Copy className="h-3 w-3" /></button>
                          </div>
                        </div>
                        {c.account && <div className="flex justify-between"><span className="text-muted-foreground">Conta</span><span className="text-foreground font-mono">{c.account}</span></div>}
                        {c.owner && <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="text-foreground">{c.owner}</span></div>}
                        {c.recovery_info && <div className="flex justify-between"><span className="text-muted-foreground">Recovery</span><span className="text-muted-foreground">{c.recovery_info}</span></div>}
                      </div>
                      {c.security_notes && (
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-start gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" />
                          <p className="text-[11px] text-warning/80">{c.security_notes}</p>
                        </div>
                      )}
                      {c.notes && <p className="text-xs text-muted-foreground mt-2">{c.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Reveal confirmation dialog */}
      <Dialog open={!!confirmReveal} onOpenChange={() => setConfirmReveal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Revelar Senha</DialogTitle>
            <DialogDescription>Esta ação será registada na trilha de auditoria. A senha será ocultada automaticamente em 30 segundos.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReveal(null)}>Cancelar</Button>
            <Button onClick={handleRevealConfirm}>Confirmar e Revelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Eliminar Credencial</DialogTitle>
            <DialogDescription>Esta ação é irreversível e será registada na auditoria.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleteConfirm) { await remove.mutateAsync(deleteConfirm); setDeleteConfirm(null); } }}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit form */}
      <Dialog open={formOpen} onOpenChange={open => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Credencial" : "Nova Credencial"}</DialogTitle>
            <DialogDescription>Preencha os dados da credencial. Campos com * são obrigatórios.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Provider *</Label>
                <Input value={provider} onChange={e => setProvider(e.target.value)} placeholder="AWS, Google, etc." className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Login *</Label>
                <Input value={login} onChange={e => setLogin(e.target.value)} placeholder="user@email.com" className="bg-secondary/50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Senha *</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Conta</Label>
                <Input value={account} onChange={e => setAccount(e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Owner</Label>
                <Input value={owner} onChange={e => setOwner(e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Classificação</Label>
                <Select value={classification} onValueChange={setClassification}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operacional</SelectItem>
                    <SelectItem value="secret">Secreto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch checked={has2FA} onCheckedChange={setHas2FA} />
                <Label className="text-xs">2FA Ativo</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Recovery Info</Label>
              <Input value={recoveryInfo} onChange={e => setRecoveryInfo(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" /> Notas de Segurança</Label>
              <Textarea value={securityNotes} onChange={e => setSecurityNotes(e.target.value)} placeholder="Alertas, riscos, observações de segurança…" className="bg-secondary/50 min-h-[60px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-secondary/50 min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
