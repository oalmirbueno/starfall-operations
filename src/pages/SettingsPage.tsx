import { Settings, Bell, Shield, Palette, Globe } from "lucide-react";

const sections = [
  { icon: Bell, title: "Notificações", description: "Configurar alertas por email, Slack e push", items: ["Email de vencimento", "Alertas de custo", "Relatórios semanais"] },
  { icon: Shield, title: "Segurança", description: "Políticas de acesso e auditoria", items: ["Rotação de credenciais", "Logs de acesso", "Política de 2FA"] },
  { icon: Palette, title: "Aparência", description: "Tema e personalização visual", items: ["Tema escuro (ativo)", "Densidade compacta", "Cor de destaque"] },
  { icon: Globe, title: "Integrações", description: "Conectar serviços e APIs externas", items: ["Webhook de alertas", "API de exportação", "SSO / SAML"] },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Preferências gerais do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 canvas-stagger">
        {sections.map(s => (
          <div key={s.title} className="bg-card border border-border rounded-lg p-5 card-hover cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.description}</div>
              </div>
            </div>
            <div className="space-y-2 ml-11">
              {s.items.map(item => (
                <div key={item} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item}</span>
                  <div className="w-8 h-4 rounded-full bg-secondary relative cursor-pointer">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-muted-foreground transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
