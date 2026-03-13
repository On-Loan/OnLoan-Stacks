import { cn } from "@/lib/utils";

const barVariants = {
  default: "bg-onloan-orange",
  danger: "bg-red-500",
  warning: "bg-yellow-500",
  success: "bg-emerald-500",
};

interface ProgressProps {
  value: number;
  variant?: keyof typeof barVariants;
  className?: string;
}

export function Progress({
  value,
  variant = "default",
  className,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-surface-hover",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          barVariants[variant]
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
