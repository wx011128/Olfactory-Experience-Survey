const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DATA_DIR = path.join("/tmp", "olfactory-experience-survey");
const JSON_FILE = path.join(DATA_DIR, "responses.json");
const BLOB_PATH = "responses/responses.json";

const scentKeys = ["A", "B", "C", "D"];
const scoreKeys = [
  "fit",
  "immersion",
  "impressionChange",
  "spaceImagination",
  "memoryAssociation",
  "discomfort",
  "interpretationChange",
];

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function ensureLocalDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(JSON_FILE)) fs.writeFileSync(JSON_FILE, "[]\n");
}

function readLocalResponses() {
  ensureLocalDataFile();
  try {
    return JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeLocalResponses(responses) {
  ensureLocalDataFile();
  fs.writeFileSync(JSON_FILE, `${JSON.stringify(responses, null, 2)}\n`);
}

async function blobClient() {
  return import("@vercel/blob");
}

async function readBlobResponses() {
  const { list } = await blobClient();
  const result = await list({ prefix: BLOB_PATH, limit: 1 });
  const blob = result.blobs.find((item) => item.pathname === BLOB_PATH);

  if (!blob) return [];

  const response = await fetch(`${blob.url}?t=${Date.now()}`);
  if (!response.ok) return [];

  try {
    return await response.json();
  } catch {
    return [];
  }
}

async function writeBlobResponses(responses) {
  const { put } = await blobClient();
  await put(BLOB_PATH, `${JSON.stringify(responses, null, 2)}\n`, {
    access: "public",
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  });
}

async function readResponses() {
  if (hasBlobStorage()) return readBlobResponses();
  return readLocalResponses();
}

async function writeResponses(responses) {
  if (hasBlobStorage()) {
    await writeBlobResponses(responses);
    return;
  }
  writeLocalResponses(responses);
}

function csvHeaders() {
  const headers = [
    "id",
    "createdAt",
    "participantId",
    "ageGroup",
    "scentSensitivity",
    "order",
    "baselineImpressions",
    "baselineSpace",
    "baselineMemory",
  ];

  for (const key of scentKeys) {
    for (const score of scoreKeys) headers.push(`${key}_${score}`);
    headers.push(`${key}_visualChecks`);
    headers.push(`${key}_comment`);
  }

  headers.push(
    "bestFit",
    "mostChanged",
    "bestSpace",
    "bestMemory",
    "mostDiscomfort",
    "experienceChanged",
    "finalComment",
  );

  return headers;
}

function normalizeSubmission(payload) {
  const clean = payload && typeof payload === "object" ? payload : {};
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    participantId: String(clean.participantId || "").trim(),
    ageGroup: String(clean.ageGroup || "").trim(),
    scentSensitivity: String(clean.scentSensitivity || "").trim(),
    order: Array.isArray(clean.order) ? clean.order.map(String) : [],
    baseline: {
      impressions: Array.isArray(clean.baseline?.impressions)
        ? clean.baseline.impressions.map(String)
        : [],
      space: String(clean.baseline?.space || "").trim(),
      memory: String(clean.baseline?.memory || "").trim(),
    },
    scents: Object.fromEntries(
      scentKeys.map((key) => [
        key,
        {
          scores: Object.fromEntries(
            scoreKeys.map((score) => [
              score,
              Number.parseInt(clean.scents?.[key]?.scores?.[score], 10) || "",
            ]),
          ),
          visualChecks: Array.isArray(clean.scents?.[key]?.visualChecks)
            ? clean.scents[key].visualChecks.map(String)
            : [],
          comment: String(clean.scents?.[key]?.comment || "").trim(),
        },
      ]),
    ),
    comparison: {
      bestFit: String(clean.comparison?.bestFit || "").trim(),
      mostChanged: String(clean.comparison?.mostChanged || "").trim(),
      bestSpace: String(clean.comparison?.bestSpace || "").trim(),
      bestMemory: String(clean.comparison?.bestMemory || "").trim(),
      mostDiscomfort: String(clean.comparison?.mostDiscomfort || "").trim(),
      experienceChanged: String(clean.comparison?.experienceChanged || "").trim(),
      finalComment: String(clean.comparison?.finalComment || "").trim(),
    },
  };
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join(" / ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toRow(item) {
  const row = [
    item.id,
    item.createdAt,
    item.participantId,
    item.ageGroup,
    item.scentSensitivity,
    item.order,
    item.baseline?.impressions || [],
    item.baseline?.space,
    item.baseline?.memory,
  ];

  for (const key of scentKeys) {
    for (const score of scoreKeys) row.push(item.scents?.[key]?.scores?.[score]);
    row.push(item.scents?.[key]?.visualChecks || []);
    row.push(item.scents?.[key]?.comment);
  }

  row.push(
    item.comparison?.bestFit,
    item.comparison?.mostChanged,
    item.comparison?.bestSpace,
    item.comparison?.bestMemory,
    item.comparison?.mostDiscomfort,
    item.comparison?.experienceChanged,
    item.comparison?.finalComment,
  );

  return row.map(csvEscape).join(",");
}

function toCsv(responses) {
  return `${csvHeaders().map(csvEscape).join(",")}\n${responses.map(toRow).join("\n")}\n`;
}

module.exports = {
  normalizeSubmission,
  readResponses,
  toCsv,
  writeResponses,
};
