import Papa from "papaparse";

/**
 * Parses raw CSV text into an array of row objects (header => value)
 * plus the list of raw headers, exactly as they appeared in the file.
 * We do NOT assume fixed column names — whatever headers exist are kept
 * verbatim so the AI extraction step can reason about them.
 */
export function parseCsv(rawCsvText) {
  const result = Papa.parse(rawCsvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
    dynamicTyping: false,
  });

  if (result.errors && result.errors.length) {
    // PapaParse reports row-level errors (e.g. malformed quotes). We keep
    // parsing best-effort but surface a warning list to the caller.
    const fatal = result.errors.filter((e) => e.type === "Delimiter" || e.type === "Quotes" && e.code === "MissingQuotes");
    if (fatal.length && (!result.data || result.data.length === 0)) {
      throw new Error("Could not parse CSV file. Please check the file format.");
    }
  }

  const headers = result.meta?.fields || [];
  const rows = (result.data || []).filter((row) =>
    Object.values(row).some((v) => String(v ?? "").trim().length > 0)
  );

  return { headers, rows, warnings: result.errors || [] };
}

/**
 * Splits an array of rows into fixed-size batches for AI processing.
 */
export function chunkRows(rows, batchSize) {
  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }
  return batches;
}
