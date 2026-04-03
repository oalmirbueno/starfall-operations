import { useState } from "react";
import { credentials } from "@/data/mockData";
import { Eye, EyeOff, Copy, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function Credentials() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => setRevealed(prev => ({ ...prev, [id]: !prev[id] }));
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Credenciais</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão segura de acessos e credenciais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 canvas-stagger">
        {credentials.map(c => (
          <div key={c.id} className="bg-card border border-border rounded-lg p-5 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {c.has2FA ? <ShieldCheck className="h-4 w-4 text-primary" /> : <ShieldAlert className="h-4 w-4 text-warning" />}
                <span className="font-medium text-foreground">{c.provider}</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${c.has2FA ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                {c.has2FA ? "2FA ativo" : "sem 2FA"}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Login</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-mono">{c.login}</span>
                  <button onClick={() => copyToClipboard(c.login)} className="text-muted-foreground hover:text-primary transition-colors"><Copy className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Senha</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-mono">{revealed[c.id] ? c.password : "••••••••••"}</span>
                  <button onClick={() => toggleReveal(c.id)} className="text-muted-foreground hover:text-primary transition-colors">
                    {revealed[c.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                  <button onClick={() => copyToClipboard(c.password)} className="text-muted-foreground hover:text-primary transition-colors"><Copy className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Conta</span><span className="text-foreground font-mono">{c.account}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="text-foreground">{c.owner}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Recovery</span><span className="text-muted-foreground">{c.recoveryInfo}</span></div>
            </div>
            {c.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">{c.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
