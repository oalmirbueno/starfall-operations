import { Bell, Shield, Palette, Globe, Loader2 } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";

const sections = [
  {
    icon: Bell,
    title: "Notificações",
    description: "Configurar alertas por email, Slack e push",
    items: [
      { key: "notify_email_expiry", label: "Email de vencimento" },
      { key: "notify_cost_alerts", label: "Alertas de custo" },
      { key: "notify_weekly_reports", label: "Relatórios semanais" },
    ],
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Políticas de acesso e auditoria",
    items: [
      { key: "security_credential_rotation", label: "Rotação de credenciais" },
      { key: "security_access_logs", label: "Logs de acesso" },
      { key: "security_2fa_policy", label: "Política de 2FA" },
    ],
  },
  {
    icon: Palette,
    title: "Aparência",
    description: "Tema e personalização visual",
    items: [
      { key: "appearance_dark_theme", label: "Tema escuro" },
      { key: "appearance_compact_density", label: "Densidade compacta" },
      { key: "appearance_accent_color", label: "Cor de destaque" },
    ],
  },
  {
    icon: Globe,
    title: "Integrações",
    description: "Conectar serviços e APIs externas",
    items: [
      { key: "integration_webhook_alerts", label: "Webhook de alertas" },
      { key: "integration_export_api", label: "API de exportação" },
      { key: "integration_sso_saml", label: "SSO / SAML" },
    ],
  },
];

export default function SettingsPage() {
  const { settingsMap, isLoading, toggle } = useUserSettings();

  const handleToggle = (key: string) => {
    const current = settingsMap[key] ?? false;
    toggle.mutate({ key, enabled: !current });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Preferências gerais do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 canvas-stagger">
        {sections.map(s => (
          <div key={s.title} className="bg-card border border-border rounded-lg p-5 card-hover">
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
              {s.items.map(item => {
                const enabled = settingsMap[item.key] ?? false;
                return (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${
                        enabled ? "bg-primary" : "bg-secondary"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-3 h-3 rounded-full transition-transform ${
                          enabled
                            ? "translate-x-4 bg-primary-foreground"
                            : "translate-x-0.5 bg-muted-foreground"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
