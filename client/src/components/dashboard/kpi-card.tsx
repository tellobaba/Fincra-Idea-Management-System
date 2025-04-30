import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label: string;
  };
  className?: string;
}

export function KpiCard({ title, value, icon, trend, className }: KpiCardProps) {
  const getTrendIcon = () => {
    switch (trend?.direction) {
      case "up":
        return <ArrowUp className="h-4 w-4 mr-1 text-success" />;
      case "down":
        return <ArrowDown className="h-4 w-4 mr-1 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 mr-1 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case "up":
        return "text-success";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <span className="text-primary">{icon}</span>
        </div>
        <p className="text-2xl font-semibold">{value}</p>
        {trend && (
          <p className={cn("text-xs font-medium flex items-center mt-1", getTrendColor())}>
            {getTrendIcon()}
            {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
