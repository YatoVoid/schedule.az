"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Service = { id: string; name: string; durationMin: number; priceAzn: string | null };

const COLLAPSED_COUNT = 4;

export function ServiceList({ services }: { services: Service[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? services : services.slice(0, COLLAPSED_COUNT);
  const hiddenCount = services.length - COLLAPSED_COUNT;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm">
          <div>
            <p className="font-medium">{s.name}</p>
            <p className="text-muted-foreground">{s.durationMin} min</p>
          </div>
          <span className="font-medium">{s.priceAzn ? `${s.priceAzn} AZN` : "Discussed in store"}</span>
        </div>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Show fewer" : `Show all ${services.length} services`}
        </button>
      )}
    </div>
  );
}
