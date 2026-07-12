import { parseCsv } from "../services/csvParser.service.js";
import { extractCrmRecords } from "../services/aiExtractor.service.js";

export async function importCsv(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Attach a CSV file under the 'file' field." });
    }

    const rawText = req.file.buffer.toString("utf-8");
    const { headers, rows, warnings } = parseCsv(rawText);

    if (!rows.length) {
      return res.status(422).json({ error: "The uploaded CSV has no data rows to import." });
    }

    const progressLog = [];
    const { successful, skipped, totalBatches } = await extractCrmRecords(rows, (event) => {
      progressLog.push(event);
    });

    res.json({
      summary: {
        total_rows: rows.length,
        total_imported: successful.length,
        total_skipped: skipped.length,
        total_batches: totalBatches,
        detected_columns: headers,
      },
      records: successful,
      skipped_records: skipped,
      parse_warnings: warnings,
    });
  } catch (err) {
    next(err);
  }
}

export function healthCheck(req, res) {
  res.json({ status: "ok", provider: process.env.AI_PROVIDER || "anthropic" });
}
