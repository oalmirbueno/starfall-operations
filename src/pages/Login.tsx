import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoAceleriq from "@/assets/logo-aceleriq.png";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/", { replace: true });
      }
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background tech-grid-bg p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logoAceleriq} alt="Orion Stack Control" className="h-12 w-12 rounded-lg mb-4" />
          <h1 className="text-xl font-semibold text-foreground tracking-wide">Orion Stack Control</h1>
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mt-1">Painel de Comando</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {mode === "login" ? "Acesso Seguro" : "Criar Conta"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="bg-secondary/50 border-border"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-secondary/50 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/50 border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full font-medium">
              {loading ? "Processando…" : mode === "login" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "login" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 font-mono">
          Sessão encriptada • Acesso auditado • 2FA disponível
        </p>
      </div>
    </div>
  );
}
