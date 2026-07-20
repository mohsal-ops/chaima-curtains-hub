import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="minus"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="grid h-10 w-14 place-items-center rounded-md border border-border bg-card text-lg font-bold tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="plus"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
