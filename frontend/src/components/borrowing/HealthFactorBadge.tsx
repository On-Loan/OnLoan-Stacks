"use client";

import { Badge } from "@/components/ui/Badge";
import { getHealthFactorStatus } from "@/types/protocol";

interface HealthFactorBadgeProps {
  value: number;
  className?: string;
}

const statusConfig: Record<
  string,
  { variant: "success" | "warning" | "danger"; label: string }
> = {
  healthy: { variant: "success", label: "Healthy" },
  caution: { variant: "warning", label: "Caution" },
  "at-risk": { variant: "danger", label: "At Risk" },
  liquidatable: { variant: "danger", label: "Liquidatable" },
};

export function HealthFactorBadge({ value, className }: HealthFactorBadgeProps) {
  const status = getHealthFactorStatus(value);
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {value.toFixed(2)} &middot; {config.label}
    </Badge>
  );
}
