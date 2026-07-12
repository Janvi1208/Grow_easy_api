import { CRM_FIELDS, ALLOWED_CRM_STATUS, ALLOWED_DATA_SOURCE } from "../config/constants.js";

/**
 * Re-validates every record the AI returns. We never trust the model
 * blindly — this is the last line of defense before data reaches the
 * frontend, and it's what makes "skip invalid records" deterministic
 * instead of relying purely on the model's judgement.
 */
export function sanitizeRecord(raw) {
  const record = {};

  for (const field of CRM_FIELDS) {
    record[field] = typeof raw?.[field] === "string" ? raw[field].trim() : "";
  }

  // Rule: crm_status must be one of the allowed enum values, else blank.
  if (!ALLOWED_CRM_STATUS.includes(record.crm_status)) {
    record.crm_status = "";
  }

  // Rule: data_source must be one of the allowed enum values, else blank.
  if (!ALLOWED_DATA_SOURCE.includes(record.data_source)) {
    record.data_source = "";
  }

  // Rule: created_at must be parseable by `new Date(...)`.
  if (record.created_at && Number.isNaN(Date.parse(record.created_at))) {
    record.created_at = "";
  }

  // Strip characters that would break a single-row CSV line.
  for (const field of CRM_FIELDS) {
    record[field] = String(record[field] ?? "")
      .replace(/\r\n|\r|\n/g, "\\n")
      .trim();
  }

  const hasEmail = record.email && /\S+@\S+\.\S+/.test(record.email);
  const hasMobile = record.mobile_without_country_code && /\d{5,}/.test(record.mobile_without_country_code);

  return {
    record,
    isValid: Boolean(hasEmail || hasMobile),
  };
}

export function sanitizeBatch(rawRecords, originalRows) {
  const successful = [];
  const skipped = [];

  rawRecords.forEach((raw, idx) => {
    const { record, isValid } = sanitizeRecord(raw);
    if (isValid) {
      successful.push(record);
    } else {
      skipped.push({
        reason: "Missing both email and mobile number",
        source_row: originalRows?.[idx] ?? raw,
      });
    }
  });

  return { successful, skipped };
}
