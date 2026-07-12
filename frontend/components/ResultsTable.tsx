"use client";

import { useState } from "react";
import type { CrmRecord, SkippedRecord } from "@/lib/types";
import { CRM_FIELD_ORDER } from "@/lib/types";

interface Props {
  records: CrmRecord[];
  skipped: SkippedRecord[];
}

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "bg-moss-light text-moss",
  DID_NOT_CONNECT: "bg-amber-light text-amber",
  BAD_LEAD: "bg-rose-light text-rose",
  SALE_DONE: "bg-coral-light text-coral-dark",
};

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-slate/50">—</span>;
  const style = STATUS_STYLES[status] || "bg-line text-slate";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function ResultsTable({ records, skipped }: Props) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setTab("imported")}
          className={`focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "imported" ? "bg-ink text-white" : "bg-panel text-slate border border-line"
          }`}
        >
          Imported ({records.length})
        </button>
        <button
          onClick={() => setTab("skipped")}
          className={`focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "skipped" ? "bg-ink text-white" : "bg-panel text-slate border border-line"
          }`}
        >
          Skipped ({skipped.length})
        </button>
      </div>

      {tab === "imported" ? (
        records.length === 0 ? (
          <EmptyState message="No records were imported. Try a different CSV or check the AI provider configuration." />
        ) : (
          <div className="overflow-hidden rounded-xl2 border border-line bg-panel shadow-soft">
            <div className="crm-scroll overflow-auto" style={{ maxHeight: "28rem" }}>
              <table className="w-full min-w-max border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-ink text-paper">
                    {CRM_FIELD_ORDER.map((f) => (
                      <th key={f} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-panel" : "bg-paper/60"}>
                      {CRM_FIELD_ORDER.map((f) => (
                        <td key={f} className="max-w-xs truncate whitespace-nowrap px-4 py-2.5 text-ink">
                          {f === "crm_status" ? (
                            <StatusBadge status={rec[f]} />
                          ) : rec[f] ? (
                            rec[f]
                          ) : (
                            <span className="text-slate/50">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : skipped.length === 0 ? (
        <EmptyState message="Nothing was skipped — every row had a usable email or mobile number." good />
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-line bg-panel shadow-soft">
          <div className="crm-scroll overflow-auto" style={{ maxHeight: "28rem" }}>
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-ink text-paper">
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide">Reason</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide">Original row</th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-panel" : "bg-paper/60"}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-rose">{s.reason}</td>
                    <td className="max-w-xl px-4 py-2.5 font-mono text-xs text-slate">{JSON.stringify(s.source_row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, good }: { message: string; good?: boolean }) {
  return (
    <div className="rounded-xl2 border border-dashed border-line bg-panel px-6 py-12 text-center">
      <p className={`text-sm font-medium ${good ? "text-moss" : "text-slate"}`}>{message}</p>
    </div>
  );
}
