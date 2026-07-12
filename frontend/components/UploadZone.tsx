"use client";

import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
  error?: string | null;
}

const MAX_SIZE_MB = 8;

export default function UploadZone({ onFileAccepted, error }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAccept = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
      if (!isCsv) {
        setLocalError("Only .csv files are supported.");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setLocalError(`File is larger than ${MAX_SIZE_MB}MB.`);
        return;
      }
      setLocalError(null);
      onFileAccepted(file);
    },
    [onFileAccepted]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      validateAndAccept(e.dataTransfer.files?.[0]);
    },
    [validateAndAccept]
  );

  const shownError = localError || error;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          "focus-ring group flex cursor-pointer flex-col items-center justify-center rounded-xl2 border-2 border-dashed px-6 py-16 text-center transition-all",
          isDragging ? "border-coral bg-coral-light/60 scale-[1.005]" : "border-line bg-panel hover:border-coral/60 hover:bg-coral-light/20",
        ].join(" ")}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral-light text-coral">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16V4M12 4L7 9M12 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-display text-lg font-semibold text-ink">Drop your CSV here</p>
        <p className="mt-1 text-sm text-slate">or click to browse files from your computer</p>
        <p className="mt-4 text-xs text-slate">Facebook · Google Ads · Excel · Real Estate CRM · Manual sheets — any layout works</p>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-slate">
          Supported file: .csv (max {MAX_SIZE_MB}MB)
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => validateAndAccept(e.target.files?.[0])}
        />
      </div>
      {shownError && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-rose">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          {shownError}
        </p>
      )}
    </div>
  );
}
