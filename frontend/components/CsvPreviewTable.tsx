"use client";

import type { RawCsvRow } from "@/lib/types";

interface Props {
  headers: string[];
  rows: RawCsvRow[];
  maxHeight?: string;
}

export default function CsvPreviewTable({ headers, rows, maxHeight = "22rem" }: Props) {
  return (
    <div className="overflow-hidden rounded-xl2 border border-line bg-panel shadow-soft">
      <div className="crm-scroll overflow-auto" style={{ maxHeight }}>
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-ink text-paper">
              <th className="sticky left-0 z-20 bg-ink px-3 py-3 text-xs font-semibold uppercase tracking-wide text-white/60">#</th>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-panel" : "bg-paper/60"}>
                <td className="sticky left-0 z-[5] whitespace-nowrap bg-inherit px-3 py-2.5 font-mono text-xs text-slate">{i + 1}</td>
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-4 py-2.5 text-ink">
                    {row[h]?.trim() ? row[h] : <span className="text-slate/50">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
