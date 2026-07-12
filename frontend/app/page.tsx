"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";
import UploadZone from "@/components/UploadZone";
import CsvPreviewTable from "@/components/CsvPreviewTable";
import ResultsTable from "@/components/ResultsTable";
import StatsBar from "@/components/StatsBar";
import Stepper from "@/components/Stepper";
import { importCsvFile } from "@/lib/api";
import type { ImportResponse, RawCsvRow } from "@/lib/types";

type Stage = "upload" | "preview" | "processing" | "results";

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawCsvRow[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const handleFileAccepted = useCallback((selected: File) => {
    setUploadError(null);
    Papa.parse<RawCsvRow>(selected, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const cleanRows = (res.data || []).filter((r) => Object.values(r).some((v) => String(v ?? "").trim()));
        if (!cleanRows.length) {
          setUploadError("This CSV doesn't seem to have any data rows.");
          return;
        }
        setFile(selected);
        setHeaders(res.meta.fields || []);
        setRows(cleanRows);
        setStage("preview");
      },
      error: (err) => setUploadError(err.message || "Could not parse this CSV."),
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file) return;
    setStage("processing");
    setImportError(null);
    try {
      const data = await importCsvFile(file);
      setResult(data);
      setStage("results");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed. Please try again.");
      setStage("preview");
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setStage("upload");
    setFile(null);
    setHeaders([]);
    setRows([]);
    setResult(null);
    setImportError(null);
    setUploadError(null);
  }, []);

  const stepNumber = stage === "upload" ? 1 : stage === "preview" ? 2 : stage === "processing" ? 3 : 4;

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-panel/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-display text-sm font-bold text-coral">
              G
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-ink">GrowEasy</span>
            <span className="ml-2 hidden rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-medium text-slate sm:inline">
              CSV Lead Importer
            </span>
          </div>
          {stage !== "upload" && (
            <button
              onClick={handleReset}
              className="focus-ring rounded-full border border-line bg-panel px-3.5 py-1.5 text-sm font-medium text-slate transition-colors hover:border-coral hover:text-coral-dark"
            >
              Start over
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Turn any lead export into a clean CRM import
          </h1>
          <p className="mt-2 max-w-2xl text-slate">
            Facebook, Google Ads, Excel, another CRM, or a spreadsheet someone built by hand — upload it as-is.
            AI maps the columns to GrowEasy's format for you.
          </p>
        </div>

        <div className="mb-8">
          <Stepper current={stepNumber} />
        </div>

        {stage === "upload" && (
          <section>
            <UploadZone onFileAccepted={handleFileAccepted} error={uploadError} />
          </section>
        )}

        {(stage === "preview" || stage === "processing") && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Preview: {file?.name}</h2>
                <p className="text-sm text-slate">
                  {rows.length} rows detected · {headers.length} columns · nothing sent to AI yet
                </p>
              </div>
              <button
                onClick={handleConfirmImport}
                disabled={stage === "processing"}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:bg-coral-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {stage === "processing" ? (
                  <>
                    <Spinner /> Mapping leads with AI…
                  </>
                ) : (
                  <>Confirm &amp; import with AI</>
                )}
              </button>
            </div>

            {importError && (
              <p className="rounded-xl2 border border-rose/30 bg-rose-light px-4 py-3 text-sm font-medium text-rose">
                {importError}
              </p>
            )}

            <CsvPreviewTable headers={headers} rows={rows} />

            {stage === "processing" && (
              <div className="flex items-center gap-3 rounded-xl2 border border-line bg-panel px-4 py-3 shadow-soft">
                <Spinner />
                <p className="text-sm text-slate">
                  Sending {rows.length} rows to the AI in batches and mapping them into the GrowEasy schema. This
                  can take a moment for larger files.
                </p>
              </div>
            )}
          </section>
        )}

        {stage === "results" && result && (
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Import complete</h2>
              <p className="text-sm text-slate">
                Detected columns: {result.summary.detected_columns.join(", ")}
              </p>
            </div>
            <StatsBar summary={result.summary} />
            <ResultsTable records={result.records} skipped={result.skipped_records} />
          </section>
        )}
      </div>

      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-4 text-xs text-slate">
        Built for the GrowEasy Software Developer assignment.
      </footer>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
