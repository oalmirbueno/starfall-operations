import type { SubscriptionRow } from "@/hooks/useSubscriptions";

/** Normaliza valor mensal independente do ciclo */
export function monthlyValue(s: Pick<SubscriptionRow, "value" | "cycle">): number {
  const v = Number(s.value);
  if (s.cycle === "anual") return v / 12;
  if (s.cycle === "trimestral") return v / 3;
  return v;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Está paga no período corrente?
 * - mensal: last_paid_at dentro do mês calendário atual
 * - trimestral: nos últimos 90 dias
 * - anual: nos últimos 365 dias
 */
export function isPaidCurrentPeriod(s: SubscriptionRow): boolean {
  const lp = (s as any).last_paid_at as string | null | undefined;
  if (!lp) return false;
  const paid = new Date(lp);
  const now = new Date();
  if (s.cycle === "anual") {
    return (now.getTime() - paid.getTime()) / 86_400_000 < 365;
  }
  if (s.cycle === "trimestral") {
    return (now.getTime() - paid.getTime()) / 86_400_000 < 90;
  }
  // mensal — mesmo ano e mês
  return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
}

/** Pendente do mês corrente (assinatura ativa que ainda não foi paga no período) */
export function isPendingThisMonth(s: SubscriptionRow): boolean {
  if (s.status !== "ativo") return false;
  return !isPaidCurrentPeriod(s);
}

/**
 * Atrasada — assinatura ativa, não paga, com vencimento em mês(es) ANTERIOR(es).
 * Itens vencidos dentro do mês corrente são apenas "pendentes do mês".
 */
export function isOverdue(s: SubscriptionRow): boolean {
  if (s.status !== "ativo") return false;
  if (isPaidCurrentPeriod(s)) return false;
  const som = startOfMonth();
  if (s.next_renewal && new Date(s.next_renewal) < som) return true;
  const lp = (s as any).last_paid_at as string | null | undefined;
  if (lp) {
    const paid = new Date(lp);
    if (s.cycle === "mensal" && paid < new Date(som.getFullYear(), som.getMonth() - 1, 1)) return true;
    if (s.cycle === "trimestral" && (Date.now() - paid.getTime()) / 86_400_000 > 92) return true;
    if (s.cycle === "anual" && (Date.now() - paid.getTime()) / 86_400_000 > 366) return true;
  }
  return false;
}

/** Quantos meses de atraso (mínimo 1 quando overdue) */
export function monthsOverdue(s: SubscriptionRow): number {
  const today = new Date();
  const lp = (s as any).last_paid_at as string | null | undefined;
  if (lp) {
    const paid = new Date(lp);
    const months = (today.getFullYear() - paid.getFullYear()) * 12 + (today.getMonth() - paid.getMonth());
    return Math.max(1, months);
  }
  if (s.next_renewal) {
    const nr = new Date(s.next_renewal);
    const months = (today.getFullYear() - nr.getFullYear()) * 12 + (today.getMonth() - nr.getMonth());
    return Math.max(1, months);
  }
  return 1;
}
