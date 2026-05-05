import { useMemo, useState } from "react";
import { useCredentials, Credential } from "@/hooks/useCredentials";
import { Eye, EyeOff, Copy, ShieldCheck, ShieldAlert, Plus, Trash2, Edit, Lock, Unlock, AlertTriangle, Search, ExternalLink, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

// ---- helpers ----
const URL_REGEX = /\b((?:https?:\/\/|www\.)[^\s,;]+|[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s,;]*)?)/gi;

function normalizeUrl(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[.,;:)\]]+$/, "");
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) {
    if (!/\.[a-z]{2,}/i.test(s)) return null;
    s = "https://" + s.replace(/^\/+/, "");
  }
  try { return new URL(s).toString(); } catch { return null; }
}

function getDomain(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

function faviconFor(url: string): string | null {
  const d = getDomain(url);
  return d ? `https://www.google.com/s2/favicons?sz=64&domain=${d}` : null;
}

function deriveProviderUrl(c: Credential): string | null {
  // try notes/account/provider as a URL hint
  const candidates = [c.notes, c.account, c.provider].filter(Boolean) as string[];
  for (const text of candidates) {
    const m = text.match(URL_REGEX);
    if (m && m.length) {
      const u = normalizeUrl(m[0]);
      if (u) return u;
    }
  }
  // fallback: provider as domain guess
  const guess = c.provider?.toLowerCase().trim().replace(/\s+/g, "");
  if (guess && /^[a-z0-9-]+$/.test(guess)) return `https://${guess}.com`;
  return null;
}

function LinkifiedText({ text }: { text: string }) {
  const parts: Array<{ type: "text" | "link"; value: string }> = [];
  let last = 0;
  text.replace(URL_REGEX, (match, _g, offset: number) => {
    if (offset > last) parts.push({ type: "text", value: text.slice(last, offset) });
    parts.push({ type: "link", value: match });
    last = offset + match.length;
    return match;
  });
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return (
    <>
      {parts.map((p, i) => {
        if (p.type === "text") return <span key={i}>{p.value}</span>;
        const u = normalizeUrl(p.value);
        if (!u) return <span key={i}>{p.value}</span>;
        return (
          <a key={i} href={u} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
            {p.value}<ExternalLink className="h-2.5 w-2.5" />
          </a>
        );
      })}
    </>
  );
}

export default function Credentials() {
  const { credentials, isLoading, create, update, remove, logReveal, logCopy } = useCredentials();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [confirmReveal, setConfirmReveal] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<Credential | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filter2FA, setFilter2FA] = useState<string>("all");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("provider");

  // Form
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
    if (editing) await update.mutateAsync({ id: editing.id, ...payload });
    else await create.mutateAsync(payload);
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
    toast.success("Copiado");
    await logCopy(id, field);
  };

  const providers = useMemo(
    () => Array.from(new Set(credentials.map(c => c.provider))).sort(),
    [credentials]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = credentials.filter(c => {
      if (filterClass !== "all" && c.classification !== filterClass) return false;
      if (filter2FA === "yes" && !c.has_2fa) return false;
      if (filter2FA === "no" && c.has_2fa) return false;
      if (filterProvider !== "all" && c.provider !== filterProvider) return false;
      if (q) {
        const hay = [c.provider, c.login, c.account, c.owner, c.notes].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      switch (sortBy) {
        case "provider": return a.provider.localeCompare(b.provider);
        case "owner": return (a.owner ?? "").localeCompare(b.owner ?? "");
        case "recent": return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "2fa": return Number(b.has_2fa) - Number(a.has_2fa);
        default: return 0;
      }
    });
    return arr;
  }, [credentials, search, filterClass, filter2FA, filterProvider, sortBy]);

  // Group by "shelf": brand-aware. Looks across provider, account, notes,
  // recovery, login domain to find a single brand stem (e.g. "google",
  // "aceleriq", "github") and groups everything that mentions it.
  const grouped = useMemo(() => {
    // Known brand aliases — first match wins, regardless of subdomain noise
    const BRAND_ALIASES: Record<string, RegExp> = {
      google: /\b(google|gmail|gsuite|workspace|youtube|gcp|firebase|googleads|adsense|analytics|gemini)\b/i,
      microsoft: /\b(microsoft|outlook|hotmail|office365|onedrive|azure|msft|live\.com|teams)\b/i,
      apple: /\b(apple|icloud|appleid|itunes)\b/i,
      meta: /\b(meta|facebook|instagram|whatsapp|messenger|threads)\b/i,
      amazon: /\b(amazon|aws|awscloud)\b/i,
      github: /\b(github|gh\.io)\b/i,
      gitlab: /\b(gitlab)\b/i,
      cloudflare: /\b(cloudflare|cf-)\b/i,
      digitalocean: /\b(digitalocean|do-cloud|droplets?)\b/i,
      hostinger: /\b(hostinger)\b/i,
      hetzner: /\b(hetzner)\b/i,
      openai: /\b(openai|chatgpt)\b/i,
      anthropic: /\b(anthropic|claude)\b/i,
      stripe: /\b(stripe)\b/i,
      paypal: /\b(paypal)\b/i,
      mercadopago: /\b(mercadopago|mercado pago)\b/i,
      supabase: /\b(supabase)\b/i,
      vercel: /\b(vercel)\b/i,
      netlify: /\b(netlify)\b/i,
      notion: /\b(notion)\b/i,
      figma: /\b(figma)\b/i,
      slack: /\b(slack)\b/i,
      discord: /\b(discord)\b/i,
    };

    const STOP = new Set([
      "www","app","apps","mail","email","login","auth","accounts","account","admin","dashboard","portal",
      "my","secure","panel","cpanel","webmail","manage","console","com","net","org","io","co","online",
      "site","web","cloud","store","shop","host","hosting","tech","dev","ai","sa","br","pt","us","uk",
      "inc","llc","ltd","ltda","corp","gmbh","labs","services","service","support","help","www2",
      "page","pages","drive","docs","mail","go","get","new","old","beta","staging","test",
    ]);

    const normalize = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const tokensFromHost = (host: string): string[] => {
      const parts = host.split(".").map(normalize);
      // remove TLD-like and stop tokens
      return parts.filter(p => p && !STOP.has(p) && !/^\d+$/.test(p));
    };

    const tokensFromText = (text: string): string[] =>
      normalize(text).split(/[^a-z0-9]+/).filter(t => t && t.length >= 3 && !STOP.has(t));

    const findBrandStem = (c: Credential): { key: string; label: string } => {
      const haystackParts: string[] = [];
      const hostTokens: string[] = [];

      const collectFromText = (txt: string | null) => {
        if (!txt) return;
        haystackParts.push(txt);
        const matches = txt.match(URL_REGEX) ?? [];
        for (const m of matches) {
          const u = normalizeUrl(m);
          const host = u ? getDomain(u) : null;
          if (host) hostTokens.push(...tokensFromHost(host));
        }
      };

      collectFromText(c.provider);
      collectFromText(c.account);
      collectFromText(c.notes);
      collectFromText(c.recovery_info);
      // login email domain
      const emailDomain = c.login?.match(/@([^\s]+)/)?.[1];
      if (emailDomain) hostTokens.push(...tokensFromHost(emailDomain));

      const haystack = haystackParts.join(" ");

      // 1) known brand alias wins
      for (const [stem, re] of Object.entries(BRAND_ALIASES)) {
        if (re.test(haystack) || hostTokens.some(t => re.test(t))) {
          return { key: stem, label: stem.charAt(0).toUpperCase() + stem.slice(1) };
        }
      }

      // 2) token that appears both in host AND in provider/account text
      const textTokens = new Set([
        ...tokensFromText(c.provider ?? ""),
        ...tokensFromText(c.account ?? ""),
      ]);
      const overlap = hostTokens.find(t => textTokens.has(t));
      if (overlap) return { key: overlap, label: overlap };

      // 3) longest meaningful host token (skip generic stuff)
      if (hostTokens.length) {
        const best = [...hostTokens].sort((a, b) => b.length - a.length)[0];
        return { key: best, label: best };
      }

      // 4) provider-name fallback (cleaned)
      const provTokens = tokensFromText(c.provider ?? "");
      if (provTokens.length) {
        const best = provTokens.sort((a, b) => b.length - a.length)[0];
        return { key: best, label: best };
      }
      const k = (c.provider ?? "outros").toLowerCase().trim() || "outros";
      return { key: k, label: c.provider ?? "Outros" };
    };

    type Shelf = { key: string; label: string; favicon: string | null; items: Credential[] };
    const groups: Record<string, Record<string, Shelf>> = { secret: {}, operational: {} };
    for (const c of filtered) {
      const cls = c.classification === "secret" ? "secret" : "operational";
      const { key, label } = findBrandStem(c);
      if (!groups[cls][key]) {
        // favicon: prefer key.com guess, fallback to derived URL
        const guessUrl = /^[a-z0-9-]+$/.test(key) ? `https://${key}.com` : null;
        const url = guessUrl ?? deriveProviderUrl(c);
        groups[cls][key] = {
          key,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          favicon: url ? faviconFor(url) : null,
          items: [],
        };
      }
      groups[cls][key].items.push(c);
    }
    return groups;
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-52 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const renderCard = (c: Credential) => {
    const url = deriveProviderUrl(c);
    const fav = url ? faviconFor(url) : null;
    return (
      <div key={c.id} className={`bg-card border rounded-lg p-5 card-hover ${c.classification === "secret" ? "border-destructive/30" : "border-border"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            {fav ? (
              <img src={fav} alt="" className="h-5 w-5 rounded-sm shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-medium text-foreground truncate">{c.provider}</span>
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Abrir site">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {c.has_2fa ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <ShieldAlert className="h-3.5 w-3.5 text-warning" />}
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${c.has_2fa ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
              {c.has_2fa ? "2FA" : "sem 2FA"}
            </span>
            <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-primary transition-colors p-1"><Edit className="h-3 w-3" /></button>
            <button onClick={() => setDeleteConfirm(c.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Trash2 className="h-3 w-3" /></button>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">Login</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-foreground font-mono truncate">{c.login}</span>
              <button onClick={() => copyToClipboard(c.login, c.id, "login")} className="text-muted-foreground hover:text-primary transition-colors shrink-0"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">Senha</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-mono">{revealed[c.id] ? c.password_encrypted : "••••••••••"}</span>
              <button onClick={() => revealed[c.id] ? hidePassword(c.id) : handleRevealRequest(c.id)} className="text-muted-foreground hover:text-primary transition-colors">
                {revealed[c.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button onClick={() => copyToClipboard(c.password_encrypted, c.id, "password")} className="text-muted-foreground hover:text-primary transition-colors"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
          {c.account && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Conta</span>
              <span className="text-foreground font-mono text-right break-all"><LinkifiedText text={c.account} /></span>
            </div>
          )}
          {c.owner && <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="text-foreground">{c.owner}</span></div>}
          {c.recovery_info && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Recovery</span>
              <span className="text-muted-foreground text-right break-all"><LinkifiedText text={c.recovery_info} /></span>
            </div>
          )}
        </div>
        {c.security_notes && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" />
            <p className="text-[11px] text-warning/80"><LinkifiedText text={c.security_notes} /></p>
          </div>
        )}
        {c.notes && <p className="text-xs text-muted-foreground mt-2 break-words"><LinkifiedText text={c.notes} /></p>}
      </div>
    );
  };

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

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar provider, login, conta…" className="pl-8 h-9 bg-secondary/50" />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-[150px] h-9 bg-secondary/50"><SelectValue placeholder="Classificação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as classes</SelectItem>
            <SelectItem value="secret">Secreto</SelectItem>
            <SelectItem value="operational">Operacional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter2FA} onValueChange={setFilter2FA}>
          <SelectTrigger className="w-[120px] h-9 bg-secondary/50"><SelectValue placeholder="2FA" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">2FA: todos</SelectItem>
            <SelectItem value="yes">Com 2FA</SelectItem>
            <SelectItem value="no">Sem 2FA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-[160px] h-9 bg-secondary/50"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos providers</SelectItem>
            {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] h-9 bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="provider">Ordenar: Provider A-Z</SelectItem>
            <SelectItem value="owner">Owner A-Z</SelectItem>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="oldest">Mais antigos</SelectItem>
            <SelectItem value="2fa">2FA primeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Lock className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-medium text-foreground mb-1">Nenhuma credencial encontrada</h3>
          <p className="text-xs text-muted-foreground mb-4">Ajuste os filtros ou adicione uma nova credencial</p>
          <Button onClick={() => { resetForm(); setFormOpen(true); }} size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
      ) : (
        <>
          {(["secret", "operational"] as const).map(cls => {
            const shelves = Object.values(grouped[cls]).sort((a, b) => a.label.localeCompare(b.label));
            if (shelves.length === 0) return null;
            const total = shelves.reduce((acc, s) => acc + s.items.length, 0);
            return (
              <div key={cls} className="space-y-4">
                <div className="flex items-center gap-2">
                  {cls === "secret" ? <Lock className="h-3.5 w-3.5 text-destructive" /> : <Unlock className="h-3.5 w-3.5 text-primary" />}
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {cls === "secret" ? "Dados Secretos" : "Dados Operacionais"}
                  </span>
                  <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{total}</span>
                </div>
                {shelves.map(s => (
                  <div key={s.key} className="space-y-2 bg-secondary/20 border border-border/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 px-1">
                      {s.favicon ? (
                        <img src={s.favicon} alt="" className="h-4 w-4 rounded-sm" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs font-semibold text-foreground capitalize">{s.label}</span>
                      <span className="text-[10px] text-muted-foreground">({s.items.length})</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {s.items.map(renderCard)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

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
                <Label className="text-xs">Conta / URL</Label>
                <Input value={account} onChange={e => setAccount(e.target.value)} placeholder="ex: https://app.exemplo.com" className="bg-secondary/50" />
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
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Links, instruções, etc. (URLs viram clicáveis)" className="bg-secondary/50 min-h-[60px]" />
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
