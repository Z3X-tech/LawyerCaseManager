import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  trend?: number;
  trendText?: string;
  trendDirection?: "up" | "down";
  trendColor?: string;
};

export default function StatsCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
  trendText,
  trendDirection = "up",
  trendColor = "text-success"
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
          <span className={cn("p-2 rounded-md", iconBg)}>
            <span className={iconColor}>{icon}</span>
          </span>
        </div>
        <p className="text-2xl font-semibold">{value}</p>
        {trend !== undefined && trendText && (
          <div className="flex items-center mt-2 text-xs">
            <span className={cn("font-medium flex items-center", trendColor)}>
              {trendDirection === "up" ? "↑" : "↓"} {trend}%
            </span>
            <span className="text-neutral-500 ml-2">{trendText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
