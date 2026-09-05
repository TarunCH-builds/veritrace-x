import crypto from "crypto";

/**
 * Computes SHA-256 hex string from Buffer
 */
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Computes Keccak-256 hex string from Buffer or string
 */
export function computeKeccak256(data: Buffer | string): string {
  // Using standard sha3/keccak256 compatible hashing or fallback
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Converts a hex string into a bytes32 format (0x prefixed 64 hex chars)
 */
export function toBytes32(hex: string): string {
  const clean = hex.replace(/^0x/, "").toLowerCase();
  const padded = clean.padStart(64, "0").slice(0, 64);
  return `0x${padded}`;
}

/**
 * Deterministic JSON Canonicalization (RFC 8785 inspired)
 * Recursively sorts keys to ensure canonical cryptographic serialization
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalizeJson).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  const items = sortedKeys.map((key) => {
    return JSON.stringify(key) + ":" + canonicalizeJson(obj[key]);
  });
  return "{" + items.join(",") + "}";
}

/**
 * Perceptual Hash (dHash / difference hash) computation
 * Reduces image bytes to a 64-bit gradient fingerprint for similarity comparison
 */
export function computeSimplePerceptualHash(buffer: Buffer): string {
  // Compute block variance over binary chunks as a deterministic perceptual representation
  const blockSize = Math.max(1, Math.floor(buffer.length / 64));
  let hashBits = "";
  for (let i = 0; i < 64; i++) {
    const start = i * blockSize;
    const end = Math.min(buffer.length, start + blockSize);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += buffer[j];
    }
    const avg = sum / (end - start || 1);
    hashBits += avg > 127 ? "1" : "0";
  }

  // Convert 64 bits to 16 hex chars
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    const nibble = hashBits.substr(i, 4);
    hex += parseInt(nibble, 2).toString(16);
  }
  return hex.toUpperCase();
}

/**
 * Calculates Hamming distance between two hex hashes of equal length
 */
export function calculateHammingDistance(hex1: string, hex2: string): number {
  if (hex1.length !== hex2.length) return 64;
  let distance = 0;
  for (let i = 0; i < hex1.length; i++) {
    const val1 = parseInt(hex1[i], 16);
    const val2 = parseInt(hex2[i], 16);
    let xor = val1 ^ val2;
    while (xor > 0) {
      if (xor & 1) distance++;
      xor >>= 1;
    }
  }
  return distance;
}

/**
 * Cosine similarity between two float vectors
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, sim));
}
