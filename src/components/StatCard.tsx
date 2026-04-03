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
    <div className="bg-card border border-border rounded-lg p-5 card-hover">
      <div className="flex items-center justify-between mb-3">
        <span className="label-sm">{label}</span>
        <div className={`p-2 rounded-md ${accent ? "bg-primary/10" : "bg-secondary"}`}>
          <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {trend && (
        <div className={`text-xs mt-1 font-mono ${trendUp ? "text-primary" : "text-destructive"}`}>
          {trend}
        </div>
      )}
    </div>
  );
}
