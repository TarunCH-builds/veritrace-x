import {
  ForensicCase,
  DashboardMetrics,
  SystemHealthStatus,
  VerificationAttempt,
  CaseStatus,
  ForensicExecutiveSummary,
  StoredEvidenceReport
} from "../types.js";

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const res = await fetch("/api/metrics");
  if (!res.ok) throw new Error("Failed to load metrics");
  return res.json();
}

export async function fetchSystemHealth(): Promise<SystemHealthStatus> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Failed to load health status");
  return res.json();
}

export async function fetchCases(search?: string, status?: string): Promise<ForensicCase[]> {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (status && status !== "ALL") params.set("status", status);
  const res = await fetch(`/api/cases?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load cases");
  return res.json();
}

export async function fetchCase(id: string): Promise<ForensicCase> {
  const res = await fetch(`/api/cases/${id}`);
  if (!res.ok) throw new Error("Failed to load case details");
  return res.json();
}

export async function createCase(payload: {
  title: string;
  filename: string;
  mimeType: string;
  base64Data: string;
}): Promise<ForensicCase> {
  const res = await fetch("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to create case" }));
    throw new Error(err.error || "Failed to create case");
  }
  return res.json();
}

export async function analyzeFace(caseId: string): Promise<ForensicCase> {
  const res = await fetch(`/api/cases/${caseId}/analyze`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Face analysis failed" }));
    throw new Error(err.error || "Face analysis failed");
  }
  return res.json();
}

export async function executeReverseSearch(caseId: string): Promise<{
  case: ForensicCase;
  providerUsed: string;
  isConfigured: boolean;
  error?: string;
}> {
  const res = await fetch(`/api/cases/${caseId}/search`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Reverse search failed" }));
    throw new Error(err.error || "Reverse search failed");
  }
  return res.json();
}

export async function correlateEvidence(caseId: string): Promise<ForensicCase> {
  const res = await fetch(`/api/cases/${caseId}/correlate`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Correlation failed" }));
    throw new Error(err.error || "Correlation failed");
  }
  return res.json();
}

export async function anchorBlockchain(caseId: string): Promise<{
  case: ForensicCase;
  anchorRecord: any;
  mode: string;
}> {
  const res = await fetch(`/api/cases/${caseId}/anchor`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Blockchain anchoring failed" }));
    throw new Error(err.error || "Blockchain anchoring failed");
  }
  return res.json();
}

export async function verifyCaseEvidence(
  caseId: string,
  payload: { base64Data: string; filename: string }
): Promise<{
  attempt: VerificationAttempt;
  case: ForensicCase;
}> {
  const res = await fetch(`/api/cases/${caseId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Verification failed" }));
    throw new Error(err.error || "Verification failed");
  }
  return res.json();
}

export async function verifyStandalone(payload: {
  hash?: string;
  base64Data?: string;
}): Promise<any> {
  const res = await fetch("/api/verify/standalone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Standalone verification failed" }));
    throw new Error(err.error || "Standalone verification failed");
  }
  return res.json();
}

export async function compareDualImages(imageA: string, imageB: string): Promise<any> {
  const res = await fetch("/api/lab/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageA, imageB })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Comparison failed" }));
    throw new Error(err.error || "Comparison failed");
  }
  return res.json();
}

export async function calculateLabHash(base64Data: string): Promise<{
  sha256: string;
  perceptualHash: string;
  sizeBytes: number;
}> {
  const res = await fetch("/api/lab/hash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Data })
  });
  if (!res.ok) throw new Error("Hash computation failed");
  return res.json();
}

export async function generateForensicSummary(payload: {
  caseId?: string;
  imageBase64?: string;
  filename?: string;
  mimeType?: string;
  focusArea?: string;
  comparisonData?: any;
}): Promise<ForensicExecutiveSummary> {
  const res = await fetch("/api/lab/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to generate summary" }));
    throw new Error(err.error || "Failed to generate forensic executive summary");
  }
  return res.json();
}

export async function fetchLedger(): Promise<{ network: any; blocks: any[] }> {
  const res = await fetch("/api/ledger");
  if (!res.ok) throw new Error("Failed to load blockchain ledger");
  return res.json();
}

export async function resetDemoDb(): Promise<void> {
  const res = await fetch("/api/system/reset-demo", { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset demo");
}

export const seedDemoData = resetDemoDb;

export async function fetchHealth(): Promise<any> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Failed to fetch health");
  return res.json();
}

export async function deleteCase(id: string): Promise<void> {
  const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete case");
}

// -------------------------------------------------------------
// Evidence Reports Archive API Client
// -------------------------------------------------------------

export async function fetchReports(query?: {
  search?: string;
  status?: string;
  category?: string;
  caseId?: string;
}): Promise<StoredEvidenceReport[]> {
  const params = new URLSearchParams();
  if (query?.search) params.set("q", query.search);
  if (query?.status && query.status !== "ALL") params.set("status", query.status);
  if (query?.category && query.category !== "ALL") params.set("category", query.category);
  if (query?.caseId) params.set("caseId", query.caseId);

  const res = await fetch(`/api/reports?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load evidence reports");
  return res.json();
}

export async function fetchReport(id: string): Promise<StoredEvidenceReport> {
  const res = await fetch(`/api/reports/${id}`);
  if (!res.ok) throw new Error("Failed to load evidence report");
  return res.json();
}

export async function storeEvidenceReport(payload: {
  caseId: string;
  examiner?: { name: string; badgeId: string; agency: string };
  notes?: string;
  tags?: string[];
  reportType?: string;
  retentionCategory?: string;
}): Promise<StoredEvidenceReport> {
  const res = await fetch("/api/reports/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to store report" }));
    throw new Error(err.error || "Failed to store evidence report");
  }
  return res.json();
}

export async function storeAllEvidenceReports(examiner?: {
  name: string;
  badgeId: string;
  agency: string;
}): Promise<{ success: boolean; message: string; storedCount: number; reports: StoredEvidenceReport[] }> {
  const res = await fetch("/api/reports/store-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examiner })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to store all reports" }));
    throw new Error(err.error || "Failed to store all evidence reports");
  }
  return res.json();
}

export async function verifyReportIntegrity(id: string): Promise<{
  valid: boolean;
  calculatedDigest: string;
  expectedDigest: string;
  verifiedAt: string;
  reportTitle: string;
}> {
  const res = await fetch(`/api/reports/${id}/verify`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Verification failed" }));
    throw new Error(err.error || "Report integrity check failed");
  }
  return res.json();
}

export async function deleteReport(id: string): Promise<void> {
  const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete report");
}

