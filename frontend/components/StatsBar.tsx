"use client";

import type { ImportSummary } from "@/lib/types";

export default function StatsBar({ summary }: { summary: ImportSummary }) {
  const items = [
    { label: "Total rows", value: summary.total_rows, tone: "text-ink" },
    { label: "Imported", value: summary.total_imported, tone: "text-moss" },
    { label: "Skipped", value: summary.total_skipped, tone: "text-rose" },
    { label: "AI batches", value: summary.total_batches, tone: "text-ink" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl2 border border-line bg-panel px-4 py-3 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">{item.label}</p>
          <p className={`font-display mt-1 text-2xl font-bold ${item.tone}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
