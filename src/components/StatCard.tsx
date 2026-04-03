import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: boolean;
}

export function StatCard({ label, value, icon: Icon, trend, trendUp, accent }: StatCardProps) {
  return (
    <div className={`group bg-card border rounded-lg p-4 card-hover relative overflow-hidden ${accent ? "border-glow glow-sm" : "border-border"}`}>
      {accent && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />}
      <div className="flex items-center justify-between mb-2.5">
        <span className="label-sm">{label}</span>
        <div className={`p-1.5 rounded-md transition-colors ${accent ? "bg-primary/10 group-hover:bg-primary/15" : "bg-secondary group-hover:bg-secondary/80"}`}>
          <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
      </div>
      <div className={`text-2xl font-bold tracking-tight font-mono ${accent ? "text-gradient" : "text-foreground"}`}>{value}</div>
      {trend && (
        <div className={`text-[11px] mt-1.5 font-mono flex items-center gap-1 ${trendUp === false ? "text-destructive" : "text-primary"}`}>
          <span className={`inline-block w-0 h-0 border-l-[3px] border-r-[3px] border-transparent ${trendUp === false ? "border-t-[4px] border-t-destructive" : "border-b-[4px] border-b-primary"}`} />
          {trend}
        </div>
      )}
    </div>
  );
}
