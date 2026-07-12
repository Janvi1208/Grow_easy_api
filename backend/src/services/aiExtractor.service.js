import Anthropic from "@anthropic-ai/sdk";
import { CRM_FIELDS, ALLOWED_CRM_STATUS, ALLOWED_DATA_SOURCE } from "../config/constants.js";
import { chunkRows } from "./csvParser.service.js";
import { sanitizeBatch } from "./validator.service.js";

const AI_PROVIDER = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
const BATCH_SIZE = Number(process.env.AI_BATCH_SIZE || 25);
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 2);

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/**
 * The system prompt encodes every business rule from the assignment brief.
 * Keeping it centralised here (rather than scattered across the codebase)
 * makes the mapping logic auditable and easy to tune.
 */
function buildSystemPrompt() {
  return `You are a data-mapping engine for GrowEasy, a real-estate CRM.

You will receive a JSON array of raw lead rows exported from arbitrary sources
(Facebook Lead Ads, Google Ads, Excel sheets, other CRMs, manual spreadsheets).
Column names, order, casing, and structure are NOT fixed and will vary between
uploads. Your job is to intelligently map each raw row into the GrowEasy CRM
schema below, using semantic understanding of column names and values — not
exact string matching.

TARGET SCHEMA (return exactly these keys for every record, as strings):
${CRM_FIELDS.map((f) => `- ${f}`).join("\n")}

FIELD MAPPING RULES:
1. crm_status: choose the closest match from this fixed set only:
   ${ALLOWED_CRM_STATUS.join(", ")}
   If nothing in the row confidently maps to one of these, return "".
2. data_source: choose the closest match from this fixed set only:
   ${ALLOWED_DATA_SOURCE.join(", ")}
   If nothing confidently matches, return "".
3. created_at: normalise to a value parseable by JavaScript's
   \`new Date(created_at)\`. Prefer "YYYY-MM-DD HH:mm:ss" or ISO 8601.
   If no date is present, return "".
4. crm_note: use this field for anything useful that doesn't fit elsewhere —
   remarks, follow-up notes, extra phone numbers, extra email addresses, or
   any other freeform info found in the row. Merge multiple such values into
   one readable note (semicolon-separated is fine).
5. If a row contains multiple email addresses: put the first one in "email"
   and append the rest to "crm_note".
   If a row contains multiple phone numbers: put the first one in
   "mobile_without_country_code" and append the rest to "crm_note".
6. country_code should be a phone dialing code like "+91" if determinable
   (infer from country, phone format, or explicit column); otherwise "".
7. Never invent data that is not present or reasonably inferable in the row.
   Leave a field as "" rather than guessing wildly.
8. Every value must be a single line — replace any internal line breaks with
   a literal "\\n" so the record can safely become one CSV row.
9. If a row has NEITHER a usable email NOR a usable mobile number, still
   return your best-effort mapping for it (a downstream validator will
   decide whether to skip it) — do not silently drop rows.

OUTPUT FORMAT — CRITICAL:
Return a JSON array, one object per input row, in the SAME ORDER as the input
rows, with EXACTLY the ${CRM_FIELDS.length} keys listed above (all string
values, use "" for unknown). No markdown fences, no commentary, no preamble,
no trailing text.
If your response format requires a JSON object at the top level rather than
a bare array, wrap it as {"records": [ ... ]} — the array itself must still
follow the exact rules above.`;
}

function buildUserPrompt(rows) {
  return `Map the following ${rows.length} raw lead rows into the GrowEasy CRM schema. Return a JSON array of ${rows.length} objects, in the same order.\n\nRAW ROWS:\n${JSON.stringify(rows, null, 0)}`;
}

function extractJsonArray(text) {
  const trimmed = text.trim();
  const cleaned = trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("AI response did not contain a JSON array");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callAnthropic(rows) {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY is not configured on the server");
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(rows) }],
  });
  const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
  return extractJsonArray(text);
}

async function callOpenAICompatible({ baseUrl, apiKey, model, providerLabel, rows }) {
  if (!apiKey) throw new Error(`API key for ${providerLabel} is not configured on the server`);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(rows) },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`${providerLabel} API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = data.choices[0].message.content;
  // Some providers (Groq incl.) require response_format to wrap the array
  // in an object when json_object mode is requested. Handle both shapes.
  try {
    return extractJsonArray(content);
  } catch {
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : Object.values(parsed).find(Array.isArray);
    if (!arr) throw new Error(`${providerLabel} response did not contain a JSON array`);
    return arr;
  }
}

async function callOpenAI(rows) {
  return callOpenAICompatible({
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    providerLabel: "OpenAI",
    rows,
  });
}

async function callGroq(rows) {
  return callOpenAICompatible({
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    providerLabel: "Groq",
    rows,
  });
}

async function callGemini(rows) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server");
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${buildSystemPrompt()}\n\n${buildUserPrompt(rows)}` }] }],
        generationConfig: { temperature: 0 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";
  return extractJsonArray(text);
}

async function callProvider(rows) {
  switch (AI_PROVIDER) {
    case "openai":
      return callOpenAI(rows);
    case "groq":
      return callGroq(rows);
    case "gemini":
      return callGemini(rows);
    case "anthropic":
    default:
      return callAnthropic(rows);
  }
}

async function processBatchWithRetry(rows, batchIndex, onProgress) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const rawRecords = await callProvider(rows);
      if (!Array.isArray(rawRecords)) throw new Error("AI response was not a JSON array");
      const { successful, skipped } = sanitizeBatch(rawRecords, rows);
      onProgress?.({ batchIndex, status: "done", attempt, count: rows.length });
      return { successful, skipped, batchIndex };
    } catch (err) {
      lastError = err;
      onProgress?.({ batchIndex, status: "retrying", attempt, error: err.message });
    }
  }
  // All retries exhausted — skip the whole batch rather than fail the request.
  onProgress?.({ batchIndex, status: "failed", error: lastError?.message });
  return {
    successful: [],
    skipped: rows.map((row) => ({ reason: `AI extraction failed: ${lastError?.message}`, source_row: row })),
    batchIndex,
  };
}

/**
 * Processes all rows in fixed-size batches. Batches run sequentially to
 * respect rate limits, but each batch has its own retry loop so one bad
 * batch never fails the whole import.
 */
export async function extractCrmRecords(rows, onProgress) {
  const batches = chunkRows(rows, BATCH_SIZE);
  const results = [];
  for (let i = 0; i < batches.length; i++) {
    const result = await processBatchWithRetry(batches[i], i, onProgress);
    results.push(result);
  }

  const successful = results.flatMap((r) => r.successful);
  const skipped = results.flatMap((r) => r.skipped);

  return { successful, skipped, totalBatches: batches.length };
}
