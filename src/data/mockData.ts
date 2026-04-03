export interface Subscription {
  id: string;
  provider: string;
  account: string;
  plan: string;
  value: number;
  currency: string;
  cycle: "mensal" | "anual" | "trimestral";
  nextRenewal: string;
  autoRenew: boolean;
  status: "ativo" | "pendente" | "cancelado" | "expirado";
  responsible: string;
  notes: string;
  tags: string[];
  category: string;
}

export interface InfraResource {
  id: string;
  provider: string;
  type: string;
  name: string;
  ip: string;
  region: string;
  status: "online" | "offline" | "manutenção";
  cost: number;
  renewal: string;
  usage: string;
  notes: string;
}

export interface Credential {
  id: string;
  provider: string;
  account: string;
  login: string;
  password: string;
  has2FA: boolean;
  recoveryInfo: string;
  owner: string;
  notes: string;
}

export interface Alert {
  id: string;
  service: string;
  type: "vencimento" | "custo_alto" | "sem_responsável" | "auto_renew_off" | "expiração";
  urgency: "crítico" | "alto" | "médio" | "baixo";
  daysUntil?: number;
  description: string;
  date: string;
}

export interface Opportunity {
  id: string;
  tool: string;
  category: string;
  reason: string;
  status: "a_avaliar" | "pendente" | "contratar" | "descartado" | "ativo";
  estimatedCost: number;
  expectedBenefit: string;
  priority: "alta" | "média" | "baixa";
  notes: string;
}

export const subscriptions: Subscription[] = [
  { id: "s1", provider: "Vercel", account: "team@aceleriq.com", plan: "Pro", value: 20, currency: "USD", cycle: "mensal", nextRenewal: "2026-04-15", autoRenew: true, status: "ativo", responsible: "Lucas", notes: "Deploy principal", tags: ["deploy", "frontend"], category: "Hosting" },
  { id: "s2", provider: "OpenAI", account: "api@aceleriq.com", plan: "Plus", value: 200, currency: "USD", cycle: "mensal", nextRenewal: "2026-04-10", autoRenew: true, status: "ativo", responsible: "Marina", notes: "API GPT-4o", tags: ["AI", "API"], category: "AI/ML" },
  { id: "s3", provider: "AWS", account: "infra@aceleriq.com", plan: "Enterprise", value: 1850, currency: "USD", cycle: "mensal", nextRenewal: "2026-04-30", autoRenew: true, status: "ativo", responsible: "Carlos", notes: "EC2+S3+RDS", tags: ["cloud", "infra"], category: "Cloud" },
  { id: "s4", provider: "Figma", account: "design@aceleriq.com", plan: "Organization", value: 75, currency: "USD", cycle: "mensal", nextRenewal: "2026-04-20", autoRenew: true, status: "ativo", responsible: "Ana", notes: "Design system", tags: ["design"], category: "Design" },
  { id: "s5", provider: "Slack", account: "team@aceleriq.com", plan: "Business+", value: 450, currency: "USD", cycle: "mensal", nextRenewal: "2026-05-01", autoRenew: true, status: "ativo", responsible: "Lucas", notes: "Comunicação interna", tags: ["comunicação"], category: "Comunicação" },
  { id: "s6", provider: "GitHub", account: "dev@aceleriq.com", plan: "Enterprise", value: 210, currency: "USD", cycle: "mensal", nextRenewal: "2026-04-08", autoRenew: false, status: "pendente", responsible: "Carlos", notes: "Repositórios privados", tags: ["dev", "git"], category: "Desenvolvimento" },
  { id: "s7", provider: "Notion", account: "ops@aceleriq.com", plan: "Team", value: 96, currency: "USD", cycle: "anual", nextRenewal: "2026-06-15", autoRenew: true, status: "ativo", responsible: "Marina", notes: "Wiki interna", tags: ["docs"], category: "Produtividade" },
  { id: "s8", provider: "Cloudflare", account: "dns@aceleriq.com", plan: "Pro", value: 25, currency: "USD", cycle: "mensal", nextRenewal: "2026-04-12", autoRenew: true, status: "ativo", responsible: "Carlos", notes: "CDN + WAF", tags: ["segurança", "cdn"], category: "Segurança" },
  { id: "s9", provider: "Stripe", account: "payments@aceleriq.com", plan: "Standard", value: 0, currency: "USD", cycle: "mensal", nextRenewal: "2026-04-30", autoRenew: true, status: "ativo", responsible: "Lucas", notes: "Processamento de pagamentos", tags: ["pagamentos"], category: "Financeiro" },
  { id: "s10", provider: "Datadog", account: "monitoring@aceleriq.com", plan: "Pro", value: 380, currency: "USD", cycle: "mensal", nextRenewal: "2026-04-05", autoRenew: false, status: "pendente", responsible: "", notes: "Monitoramento infra", tags: ["monitoring"], category: "Observabilidade" },
];

export const infraResources: InfraResource[] = [
  { id: "i1", provider: "AWS", type: "EC2", name: "prod-api-01", ip: "52.14.22.180", region: "us-east-1", status: "online", cost: 450, renewal: "2026-04-30", usage: "78%", notes: "API principal" },
  { id: "i2", provider: "AWS", type: "RDS", name: "prod-db-main", ip: "10.0.1.50", region: "us-east-1", status: "online", cost: 620, renewal: "2026-04-30", usage: "65%", notes: "PostgreSQL 15" },
  { id: "i3", provider: "DigitalOcean", type: "Droplet", name: "staging-api", ip: "167.71.45.12", region: "nyc1", status: "online", cost: 48, renewal: "2026-04-15", usage: "22%", notes: "Ambiente de staging" },
  { id: "i4", provider: "Hetzner", type: "VPS", name: "vpn-gateway", ip: "95.216.10.42", region: "eu-central", status: "online", cost: 15, renewal: "2026-05-01", usage: "12%", notes: "VPN corporativa" },
  { id: "i5", provider: "AWS", type: "S3", name: "assets-cdn", ip: "-", region: "us-east-1", status: "online", cost: 85, renewal: "-", usage: "340GB", notes: "Assets estáticos" },
  { id: "i6", provider: "GCP", type: "GKE", name: "ml-cluster", ip: "34.82.10.5", region: "us-west1", status: "manutenção", cost: 780, renewal: "2026-04-30", usage: "45%", notes: "Cluster ML/AI" },
];

export const credentials: Credential[] = [
  { id: "c1", provider: "AWS", account: "infra@aceleriq.com", login: "admin-root", password: "Kx9$mP2!vL7nQ4", has2FA: true, recoveryInfo: "MFA device - Yubikey 5", owner: "Carlos", notes: "Conta root - uso restrito" },
  { id: "c2", provider: "Vercel", account: "team@aceleriq.com", login: "team@aceleriq.com", password: "Vr8#tN5@wJ3kM1", has2FA: true, recoveryInfo: "Email recovery", owner: "Lucas", notes: "Acesso admin" },
  { id: "c3", provider: "OpenAI", account: "api@aceleriq.com", login: "api@aceleriq.com", password: "Ai6%dR9&hF2sL8", has2FA: false, recoveryInfo: "Phone +55 11 9xxxx", owner: "Marina", notes: "API key separada" },
  { id: "c4", provider: "GitHub", account: "dev@aceleriq.com", login: "aceleriq-admin", password: "Gh4!bW7#zQ1nE5", has2FA: true, recoveryInfo: "Recovery codes salvos no vault", owner: "Carlos", notes: "Owner da org" },
  { id: "c5", provider: "Cloudflare", account: "dns@aceleriq.com", login: "admin@aceleriq.com", password: "Cf3$jK8!mP6vN2", has2FA: true, recoveryInfo: "Authenticator app", owner: "Carlos", notes: "Gestão de DNS" },
  { id: "c6", provider: "Stripe", account: "payments@aceleriq.com", login: "finance@aceleriq.com", password: "St7#nL4@cR9wM5", has2FA: true, recoveryInfo: "Phone verificado", owner: "Lucas", notes: "Dashboard financeiro" },
];

export const alerts: Alert[] = [
  { id: "a1", service: "Datadog", type: "vencimento", urgency: "crítico", daysUntil: 2, description: "Renovação em 2 dias - sem responsável definido", date: "2026-04-05" },
  { id: "a2", service: "GitHub", type: "auto_renew_off", urgency: "alto", daysUntil: 5, description: "Auto-renovação desligada - risco de perda", date: "2026-04-08" },
  { id: "a3", service: "OpenAI", type: "custo_alto", urgency: "alto", description: "Custo 40% acima da média dos últimos 3 meses", date: "2026-04-03" },
  { id: "a4", service: "Datadog", type: "sem_responsável", urgency: "crítico", description: "Sem responsável atribuído para a conta", date: "2026-04-03" },
  { id: "a5", service: "Cloudflare", type: "vencimento", urgency: "médio", daysUntil: 9, description: "Renovação em 9 dias", date: "2026-04-12" },
  { id: "a6", service: "Vercel", type: "vencimento", urgency: "médio", daysUntil: 12, description: "Renovação em 12 dias", date: "2026-04-15" },
  { id: "a7", service: "GKE Cluster", type: "expiração", urgency: "baixo", daysUntil: 27, description: "Manutenção programada - verificar certificados", date: "2026-04-30" },
];

export const opportunities: Opportunity[] = [
  { id: "o1", tool: "Resend", category: "Email", reason: "Substituir SendGrid por menor custo e melhor DX", status: "a_avaliar", estimatedCost: 20, expectedBenefit: "Redução de 70% no custo de email transacional", priority: "alta", notes: "API moderna, SDK React Email" },
  { id: "o2", tool: "Turso", category: "Database", reason: "Edge database para reduzir latência", status: "pendente", estimatedCost: 29, expectedBenefit: "Latência <10ms globalmente", priority: "média", notes: "Compatível com libSQL" },
  { id: "o3", tool: "Upstash", category: "Cache", reason: "Redis serverless para cache de sessões", status: "contratar", estimatedCost: 10, expectedBenefit: "Cache distribuído sem infra", priority: "alta", notes: "Pay-per-request" },
  { id: "o4", tool: "PostHog", category: "Analytics", reason: "Substituir Mixpanel - self-hosted option", status: "a_avaliar", estimatedCost: 0, expectedBenefit: "Analytics sem limite de eventos", priority: "baixa", notes: "Open source" },
  { id: "o5", tool: "Neon", category: "Database", reason: "PostgreSQL serverless com branching", status: "descartado", estimatedCost: 19, expectedBenefit: "DB branching para preview deploys", priority: "média", notes: "Incompatível com stack atual" },
];

export const monthlyTrend = [
  { month: "Nov", total: 2980 },
  { month: "Dez", total: 3120 },
  { month: "Jan", total: 3250 },
  { month: "Fev", total: 3180 },
  { month: "Mar", total: 3306 },
  { month: "Abr", total: 3306 },
];

export const categoryBreakdown = [
  { name: "Cloud", value: 1850, color: "hsl(145, 100%, 50%)" },
  { name: "AI/ML", value: 200, color: "hsl(200, 100%, 50%)" },
  { name: "Comunicação", value: 450, color: "hsl(43, 100%, 50%)" },
  { name: "Observabilidade", value: 380, color: "hsl(0, 100%, 62%)" },
  { name: "Desenvolvimento", value: 210, color: "hsl(270, 80%, 60%)" },
  { name: "Outros", value: 216, color: "hsl(0, 0%, 40%)" },
];
