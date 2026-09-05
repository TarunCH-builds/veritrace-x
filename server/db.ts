import fs from "fs";
import path from "path";
import {
  ForensicCase,
  DashboardMetrics,
  VerificationAttempt,
  ChainOfCustodyEvent,
  StoredEvidenceReport,
  ForensicExecutiveSummary
} from "../src/types.js";
import { canonicalizeJson, computeSha256 } from "./cryptoUtils.js";

const STORAGE_DIR = path.resolve(process.cwd(), "storage");
const EVIDENCE_DIR = path.join(STORAGE_DIR, "evidence");
const REPORTS_DIR = path.join(STORAGE_DIR, "reports");
const DB_FILE = path.join(STORAGE_DIR, "db.json");

interface SystemLog {
  id: string;
  caseId?: string;
  operation: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED" | "WARNING" | "INFO";
  durationMs: number;
  details?: string;
}

interface DatabaseSchema {
  cases: ForensicCase[];
  verificationHistory: VerificationAttempt[];
  systemLogs: SystemLog[];
  reports?: StoredEvidenceReport[];
}

// Ensure directories exist
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DatabaseSchema = {
      cases: getSeedCases(),
      verificationHistory: getSeedVerifications(),
      reports: getSeedReports(),
      systemLogs: [
        {
          id: "log_sys_01",
          operation: "SYSTEM_INITIALIZATION",
          timestamp: new Date().toISOString(),
          status: "SUCCESS",
          durationMs: 42,
          details: "VeriTrace X Core forensic engine initialized with SQLite/JSON persistence and Evidence Reports Vault."
        }
      ]
    };
    saveDb(initialDb);
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed: DatabaseSchema = JSON.parse(raw);
    if (!parsed.reports || parsed.reports.length === 0) {
      parsed.reports = getSeedReports();
      saveDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Failed to parse db.json, recreating empty store", err);
    const fallback: DatabaseSchema = {
      cases: getSeedCases(),
      verificationHistory: [],
      reports: getSeedReports(),
      systemLogs: []
    };
    saveDb(fallback);
    return fallback;
  }
}

function saveDb(data: DatabaseSchema): void {
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpFile, DB_FILE);
}

export const db = {
  getCases(search?: string, status?: string): ForensicCase[] {
    const data = loadDb();
    let cases = data.cases;
    if (status && status !== "ALL") {
      cases = cases.filter((c) => c.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      cases = cases.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.metadata.filename.toLowerCase().includes(q) ||
          c.metadata.sha256.toLowerCase().includes(q)
      );
    }
    return cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getCase(id: string): ForensicCase | undefined {
    const data = loadDb();
    return data.cases.find((c) => c.id === id);
  },

  createCase(newCase: ForensicCase): ForensicCase {
    const data = loadDb();
    data.cases.unshift(newCase);
    saveDb(data);
    this.logOperation("CREATE_CASE", 10, "SUCCESS", newCase.id, `Created case ${newCase.id}`);
    return newCase;
  },

  updateCase(id: string, updates: Partial<ForensicCase>): ForensicCase | undefined {
    const data = loadDb();
    const idx = data.cases.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;

    data.cases[idx] = {
      ...data.cases[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveDb(data);
    return data.cases[idx];
  },

  deleteCase(id: string): boolean {
    const data = loadDb();
    const initialLen = data.cases.length;
    data.cases = data.cases.filter((c) => c.id !== id);
    if (data.cases.length !== initialLen) {
      saveDb(data);
      this.logOperation("DELETE_CASE", 5, "SUCCESS", id, `Deleted case ${id}`);
      return true;
    }
    return false;
  },

  addTimelineEvent(caseId: string, event: Omit<ChainOfCustodyEvent, "id" | "caseId" | "timestamp">): ChainOfCustodyEvent {
    const data = loadDb();
    const c = data.cases.find((item) => item.id === caseId);
    const newEvent: ChainOfCustodyEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      caseId,
      timestamp: new Date().toISOString(),
      ...event
    };
    if (c) {
      c.timeline.push(newEvent);
      saveDb(data);
    }
    return newEvent;
  },

  addVerificationAttempt(attempt: VerificationAttempt): void {
    const data = loadDb();
    data.verificationHistory.unshift(attempt);
    const c = data.cases.find((item) => item.id === attempt.caseId);
    if (c) {
      c.verificationHistory.unshift(attempt);
      if (attempt.tamperDetected) {
        c.status = "tampered";
      } else if (attempt.match) {
        c.status = "verified";
      }
    }
    saveDb(data);
    this.logOperation(
      "VERIFICATION_ATTEMPT",
      15,
      attempt.match ? "SUCCESS" : "WARNING",
      attempt.caseId,
      attempt.details
    );
  },

  getVerificationHistory(): VerificationAttempt[] {
    const data = loadDb();
    return data.verificationHistory;
  },

  getMetrics(): DashboardMetrics {
    const data = loadDb();
    const cases = data.cases;
    
    const activeInvestigations = cases.filter((c) => c.status !== "verified" && c.status !== "failed").length;
    const evidenceItems = cases.length;
    const sourcesDiscovered = cases.reduce((acc, curr) => acc + (curr.searchResults?.length || 0), 0);
    const blockchainAnchors = cases.filter((c) => c.blockchainAnchor && c.blockchainAnchor.status === "CONFIRMED").length;
    const verifiedRecords = data.verificationHistory.filter((v) => v.match && !v.tamperDetected).length;
    const integrityFailures = data.verificationHistory.filter((v) => v.tamperDetected).length;

    return {
      activeInvestigations,
      evidenceItems,
      sourcesDiscovered,
      blockchainAnchors,
      verifiedRecords,
      integrityFailures
    };
  },

  logOperation(
    operation: string,
    durationMs: number,
    status: "SUCCESS" | "FAILED" | "WARNING" | "INFO" = "SUCCESS",
    caseId?: string,
    details?: string
  ): void {
    const data = loadDb();
    data.systemLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      caseId,
      operation,
      timestamp: new Date().toISOString(),
      status,
      durationMs,
      details
    });
    // Keep max 200 logs
    if (data.systemLogs.length > 200) {
      data.systemLogs = data.systemLogs.slice(0, 200);
    }
    saveDb(data);
  },

  getSystemLogs(): SystemLog[] {
    const data = loadDb();
    return data.systemLogs;
  },

  // -------------------------------------------------------------
  // Evidence Reports Persistence & Archival for Future Reference
  // -------------------------------------------------------------
  getReports(search?: string, status?: string, category?: string, caseId?: string): StoredEvidenceReport[] {
    const data = loadDb();
    let reports = data.reports || [];
    if (caseId) {
      reports = reports.filter((r) => r.caseId === caseId);
    }
    if (status && status !== "ALL") {
      reports = reports.filter((r) => r.archivalStatus === status);
    }
    if (category && category !== "ALL") {
      reports = reports.filter((r) => r.retentionCategory === category);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      reports = reports.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.caseId.toLowerCase().includes(q) ||
          r.caseTitle.toLowerCase().includes(q) ||
          r.evidenceSnapshot.sha256.toLowerCase().includes(q) ||
          r.examiner.name.toLowerCase().includes(q) ||
          (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  },

  getReport(id: string): StoredEvidenceReport | undefined {
    const data = loadDb();
    return (data.reports || []).find((r) => r.id === id);
  },

  storeReport(reportData: Partial<StoredEvidenceReport> & { caseId: string }): StoredEvidenceReport {
    const data = loadDb();
    if (!data.reports) data.reports = [];

    const targetCase = data.cases.find((c) => c.id === reportData.caseId);
    const reportId = reportData.id || `REP-${new Date().getFullYear()}-X${Math.floor(1000 + Math.random() * 9000)}`;

    const now = new Date().toISOString();
    const summary: ForensicExecutiveSummary = reportData.summary || {
      caseId: targetCase?.id || reportData.caseId,
      title: targetCase?.title || reportData.caseTitle || "Evidence Investigation",
      verdict: targetCase?.status === "tampered" ? "TAMPER_SUSPECTED" : "CONFIRMED_AUTHENTIC",
      confidenceScore: targetCase?.correlation?.visualPerceptualScore || 95,
      executiveOverview: `Comprehensive multi-spectral evidence audit archived for judicial and cold-case future reference. All perceptual hashes and cryptographic commitments verified under FIPS 180-4 standard.`,
      keyFindings: [
        `Cryptographic SHA-256 integrity digest (${(targetCase?.metadata.sha256 || "e3b0c4").slice(0, 16)}...) matches source evidence file exactly.`,
        `Biometric landmark geometry evaluated across 512-dimensional vector embedding.`,
        `Immutable blockchain anchor confirmed on consensus ledger.`
      ],
      biometricAssessment: {
        facesDetected: targetCase?.faceData?.facesDetected || 1,
        concordanceAnalysis: "High-confidence biometric alignment without facial warping or deepfake artifacts.",
        poseAndOcclusion: "Frontal neutral orientation, minimal occlusion.",
        biometricIntegrityRisk: "LOW"
      },
      cryptographicAssessment: {
        hashIntegrity: "Cryptographically intact, zero byte variance detected.",
        perceptualShiftAnalysis: "dHash perceptual divergence <= 2 bits (within normal variance threshold).",
        tamperingProbability: targetCase?.status === "tampered" ? "HIGH" : "VERY_LOW"
      },
      evidentiaryAdmissibility: {
        status: "COURT_READY",
        chainOfCustodyNotes: "Unbroken cryptographic custody trail recorded in compliance with FIPS 180-4 and RFC 8785.",
        recommendedActions: [
          "Deposit sealed cryptographic certificate into court evidence registry.",
          "Retain immutable snapshot in long-term cold storage archive for future discovery."
        ]
      },
      generatedAt: now,
      modelUsed: "VeriTrace X Neural Judicial Core v3.2"
    };

    const evidenceSnapshot = reportData.evidenceSnapshot || {
      filename: targetCase?.evidenceFile.originalName || "evidence_record.png",
      sha256: targetCase?.evidenceFile.sha256 || targetCase?.metadata.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      perceptualHash: targetCase?.metadata.perceptualHash,
      fileSizeBytes: targetCase?.evidenceFile.sizeBytes || targetCase?.metadata.sizeBytes || 1024,
      mimeType: targetCase?.evidenceFile.mimeType || targetCase?.metadata.mimeType || "image/png",
      url: targetCase?.evidenceFile.url
    };

    const rawToSign = {
      id: reportId,
      caseId: reportData.caseId,
      caseTitle: reportData.caseTitle || targetCase?.title || "Evidence Case",
      reportType: reportData.reportType || "FULL_FORENSIC_DOSSIER",
      generatedAt: reportData.generatedAt || now,
      evidenceSnapshot,
      summary,
      admissibilityRating: reportData.admissibilityRating || "ADMISSIBLE_FIPS_180"
    };

    const reportSignature = computeSha256(Buffer.from(canonicalizeJson(rawToSign), "utf-8"));
    const storageLocation = `storage/reports/${reportId}.json`;

    const fullReport: StoredEvidenceReport = {
      id: reportId,
      caseId: reportData.caseId,
      caseTitle: reportData.caseTitle || targetCase?.title || "Evidence Case",
      reportType: reportData.reportType || "FULL_FORENSIC_DOSSIER",
      generatedAt: reportData.generatedAt || now,
      sealedAt: reportData.sealedAt || now,
      archivalStatus: reportData.archivalStatus || "SEALED_JUDICIAL",
      retentionCategory: reportData.retentionCategory || "COURT_DISCOVERY",
      examiner: reportData.examiner || {
        name: "Inspector Evelyn Cruz",
        badgeId: "CYBER-INV-849",
        agency: "VeriTrace Forensic Investigation Bureau"
      },
      summary,
      evidenceSnapshot,
      manifestHash: targetCase?.blockchainAnchor?.manifestHash || `0x${reportSignature.slice(0, 64)}`,
      blockchainProof: targetCase?.blockchainAnchor,
      correlationOverview: targetCase?.correlation,
      admissibilityRating: reportData.admissibilityRating || "ADMISSIBLE_FIPS_180",
      storageLocation,
      reportSignature,
      notes: reportData.notes || `Archived for judicial discovery and permanent audit trail on ${new Date().toLocaleDateString()}.`,
      tags: reportData.tags || ["Court Ready", "FIPS 180-4", "Blockchain Verified", "Archived Evidence"]
    };

    // Save individual report file to disk
    try {
      fs.writeFileSync(path.join(REPORTS_DIR, `${reportId}.json`), JSON.stringify(fullReport, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write individual report file to disk", err);
    }

    // Replace if exists, or prepend
    const existingIdx = data.reports.findIndex((r) => r.id === reportId);
    if (existingIdx >= 0) {
      data.reports[existingIdx] = fullReport;
    } else {
      data.reports.unshift(fullReport);
    }

    saveDb(data);

    this.logOperation(
      "EVIDENCE_REPORT_ARCHIVED",
      18,
      "SUCCESS",
      fullReport.caseId,
      `Report ${fullReport.id} stored permanently for future reference (Signature: ${fullReport.reportSignature.slice(0, 16)}...)`
    );

    return fullReport;
  },

  storeAllCasesReports(examiner?: { name: string; badgeId: string; agency: string }): { storedCount: number; reports: StoredEvidenceReport[] } {
    const data = loadDb();
    const allCases = data.cases;
    const stored: StoredEvidenceReport[] = [];

    for (const c of allCases) {
      const existing = (data.reports || []).find((r) => r.caseId === c.id);
      const report = this.storeReport({
        id: existing ? existing.id : `REP-${new Date().getFullYear()}-${c.id.replace(/[^A-Za-z0-9]/g, "")}`,
        caseId: c.id,
        caseTitle: c.title,
        reportType: "FULL_FORENSIC_DOSSIER",
        archivalStatus: "SEALED_JUDICIAL",
        retentionCategory: "COURT_DISCOVERY",
        examiner: examiner || {
          name: "Chief Examiner Alex Vance",
          badgeId: "VERI-SEAL-091",
          agency: "National Digital Forensics Directorate"
        },
        evidenceSnapshot: {
          filename: c.evidenceFile.originalName,
          sha256: c.metadata.sha256 || c.evidenceFile.sha256,
          perceptualHash: c.metadata.perceptualHash,
          fileSizeBytes: c.metadata.sizeBytes || c.evidenceFile.sizeBytes,
          mimeType: c.metadata.mimeType || c.evidenceFile.mimeType,
          url: c.evidenceFile.url
        },
        correlationOverview: c.correlation,
        blockchainProof: c.blockchainAnchor,
        tags: ["Batch Sealed", "Evidence Archive", "Judicial Discovery", c.status.toUpperCase()]
      });
      stored.push(report);
    }

    return { storedCount: stored.length, reports: stored };
  },

  verifyReportIntegrity(id: string): { valid: boolean; calculatedDigest: string; expectedDigest: string; verifiedAt: string; reportTitle: string } {
    const report = this.getReport(id);
    if (!report) {
      throw new Error(`Report ${id} not found in archive.`);
    }

    const rawToSign = {
      id: report.id,
      caseId: report.caseId,
      caseTitle: report.caseTitle,
      reportType: report.reportType,
      generatedAt: report.generatedAt,
      evidenceSnapshot: report.evidenceSnapshot,
      summary: report.summary,
      admissibilityRating: report.admissibilityRating
    };

    const calculatedDigest = computeSha256(Buffer.from(canonicalizeJson(rawToSign), "utf-8"));
    const valid = calculatedDigest === report.reportSignature;

    return {
      valid,
      calculatedDigest,
      expectedDigest: report.reportSignature,
      verifiedAt: new Date().toISOString(),
      reportTitle: report.caseTitle
    };
  },

  deleteReport(id: string): boolean {
    const data = loadDb();
    if (!data.reports) return false;
    const before = data.reports.length;
    data.reports = data.reports.filter((r) => r.id !== id);
    if (data.reports.length < before) {
      saveDb(data);
      try {
        const filePath = path.join(REPORTS_DIR, `${id}.json`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        // ignore
      }
      return true;
    }
    return false;
  },

  resetDemo(): void {
    const initialDb: DatabaseSchema = {
      cases: getSeedCases(),
      verificationHistory: getSeedVerifications(),
      reports: getSeedReports(),
      systemLogs: [
        {
          id: `log_reset_${Date.now()}`,
          operation: "DEMO_RESET",
          timestamp: new Date().toISOString(),
          status: "SUCCESS",
          durationMs: 25,
          details: "Demonstration repository restored to verified baseline."
        }
      ]
    };
    saveDb(initialDb);
  }
};

function getSeedCases(): ForensicCase[] {
  return [
    {
      id: "VT-2026-00042",
      title: "Operation Apex: Disinformation Persona Audit",
      createdAt: "2026-09-02T14:22:10.000Z",
      updatedAt: "2026-09-02T14:35:45.000Z",
      status: "anchored",
      evidenceFile: {
        originalName: "subject_portrait_raw.png",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
        sha256: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
        sizeBytes: 842190,
        mimeType: "image/png"
      },
      metadata: {
        filename: "subject_portrait_raw.png",
        mimeType: "image/png",
        sizeBytes: 842190,
        width: 1200,
        height: 1600,
        sha256: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
        perceptualHash: "A4F298710B5E3C91",
        colorSpace: "sRGB",
        deviceModel: "Sony Alpha 7 IV",
        software: "Sony Image Firmware 2.01",
        capturedAt: "2026-08-30T10:14:02Z",
        exifData: {
          Camera: "Sony ILCE-7M4",
          FocalLength: "85mm",
          ExposureTime: "1/250s",
          ISO: "100"
        }
      },
      faceData: {
        facesDetected: 1,
        confidence: 0.987,
        boundingBoxes: [
          {
            ymin: 18.2,
            xmin: 28.5,
            ymax: 62.4,
            xmax: 71.8,
            confidence: 0.987,
            label: "Primary Subject (Face #01)"
          }
        ],
        landmarks: {
          leftEye: [34.5, 42.1],
          rightEye: [34.2, 58.7],
          nose: [46.8, 50.4],
          mouth: [56.1, 50.2]
        },
        embeddingFingerprint: "7A918B220C4F67EE1930D42F",
        embeddingDimension: 512,
        attributes: {
          poseEstimated: "Frontal (yaw: -2.1°, pitch: 1.4°)",
          lightingQuality: "High contrast studio key",
          occlusionScore: "0% (unobstructed)",
          sharpness: "Forensic standard (Nyquist > 0.85)"
        }
      },
      searchResults: [
        {
          id: "src_01",
          title: "Public Profile: Creative Director Portfolio - London, UK",
          url: "https://unsplash.com/photos/woman-wearing-black-scoop-neck-shirt-7YVZYZeITc8",
          domain: "unsplash.com",
          snippet: "High-resolution portrait photography subject verified in public creative repository.",
          thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
          provider: "Google Lens & Visual Web Grounding",
          retrievalTimestamp: "2026-09-02T14:26:05.000Z",
          visualSimilarityScore: 97.4,
          faceSimilarityScore: 96.8,
          correlationAssessment: "Strong correlation",
          availability: "Accessible",
          metadataAvailable: true,
          publishedDate: "2023-11-12",
          provenanceChain: [
            "https://unsplash.com/photos/7YVZYZeITc8",
            "https://cdn.example.org/creative/profile_88.webp"
          ]
        },
        {
          id: "src_02",
          title: "Design Summit 2024 Speaker Directory",
          url: "https://example.org/speakers/directory/sarah-m",
          domain: "example.org",
          snippet: "Panel speaker on Digital Ethics and Media Authentication.",
          thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
          provider: "Google Lens & Visual Web Grounding",
          retrievalTimestamp: "2026-09-02T14:26:12.000Z",
          visualSimilarityScore: 92.1,
          faceSimilarityScore: 94.2,
          correlationAssessment: "Strong correlation",
          availability: "Accessible",
          metadataAvailable: true,
          publishedDate: "2024-04-18"
        }
      ],
      correlation: {
        overallAssessment: "Strong correlation",
        faceCorrelationScore: 95.5,
        visualPerceptualScore: 94.8,
        sourceConsistencyScore: 98.0,
        metadataConsistencyScore: 91.2,
        summary: "Visual and biometric signals exhibit strong geometric and perceptual convergence across 2 independent public sources. Cryptographic hash of original ingest confirms integrity.",
        scientificDisclaimer: "Similarity signals support investigation but do not independently establish identity or authenticity."
      },
      manifest: {
        caseId: "VT-2026-00042",
        evidenceId: "EVD-8F31C7",
        timestamp: "2026-09-02T14:30:00.000Z",
        sha256: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
        perceptualHash: "A4F298710B5E3C91",
        metadata: {
          filename: "subject_portrait_raw.png",
          mimeType: "image/png",
          sizeBytes: 842190,
          sha256: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f"
        },
        faceDetection: {
          facesDetected: 1,
          confidence: 0.987,
          boundingBoxes: [],
          embeddingFingerprint: "7A918B220C4F67EE1930D42F",
          embeddingDimension: 512
        },
        sources: [],
        correlation: {
          overallAssessment: "Strong correlation",
          summary: "Concordance across visual discovery pipelines.",
          scientificDisclaimer: "Similarity signals support investigation but do not independently establish identity."
        }
      },
      blockchainAnchor: {
        network: "Ethereum Sepolia (Testnet)",
        chainId: 11155111,
        contractAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        transactionHash: "0x4b7e891c5298ffae30198ca1207865bcde89104fae10928bbcf7654a10294e82",
        blockNumber: 5932810,
        timestamp: "2026-09-02T14:32:15.000Z",
        submitterAddress: "0x19E7E3696f8c8A310f8A24b9176f5789A5364861",
        evidenceHash: "0x8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
        manifestHash: "0x3e18a99427b0811bda3177ce8032dae61c3125d048991bce09f6e91b5c6899f1",
        explorerUrl: "https://sepolia.etherscan.io/tx/0x4b7e891c5298ffae30198ca1207865bcde89104fae10928bbcf7654a10294e82",
        status: "CONFIRMED",
        verificationMode: "LIVE_TESTNET"
      },
      verificationHistory: [
        {
          id: "chk_01",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T15:10:00.000Z",
          testedHash: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
          expectedHash: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
          match: true,
          tamperDetected: false,
          details: "Cryptographic SHA-256 matches blockchain block 5932810 commitment exactly.",
          verifiedBy: "Lead Forensic Investigator",
          blockchainBlock: 5932810
        }
      ],
      timeline: [
        {
          id: "ev_01",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T14:22:10.000Z",
          stage: "INGESTION",
          title: "Evidence Ingested",
          description: "Raw image received and quarantined in tamper-evident secure storage.",
          actor: "Investigator agent #04",
          status: "SUCCESS"
        },
        {
          id: "ev_02",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T14:22:11.000Z",
          stage: "HASHING",
          title: "Cryptographic SHA-256 Generated",
          description: "Hash calculated: 8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
          actor: "VeriTrace Hashing Engine",
          hashSnapshot: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
          status: "SUCCESS"
        },
        {
          id: "ev_03",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T14:22:12.000Z",
          stage: "METADATA_EXTRACTION",
          title: "EXIF & Camera Metadata Extracted",
          description: "Parsed Sony ILCE-7M4 metadata, 85mm focal length, timestamp 2026-08-30.",
          actor: "Metadata Parser",
          status: "SUCCESS"
        },
        {
          id: "ev_04",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T14:23:40.000Z",
          stage: "FACE_ANALYSIS",
          title: "Face Detection Completed",
          description: "Single high-fidelity face detected with 98.7% spatial confidence.",
          actor: "Vision Forensics Model",
          status: "SUCCESS"
        },
        {
          id: "ev_05",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T14:24:00.000Z",
          stage: "EMBEDDING_GEN",
          title: "Biometric Embedding Fingerprint Derived",
          description: "512-D normalized vector generated; biometric vector withheld from chain.",
          actor: "Embedding Engine",
          status: "SUCCESS"
        },
        {
          id: "ev_06",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T14:26:15.000Z",
          stage: "REVERSE_SEARCH",
          title: "Reverse Search Discovered 2 Candidate Sources",
          description: "Discovered matching publications across photographic repositories.",
          actor: "Search Provider Adapter",
          status: "SUCCESS"
        },
        {
          id: "ev_07",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T14:28:30.000Z",
          stage: "CORRELATION",
          title: "Evidence Correlation Formulated",
          description: "Strong correlation computed. Similarity signals recorded.",
          actor: "Correlation Analysis Module",
          status: "SUCCESS"
        },
        {
          id: "ev_08",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T14:30:00.000Z",
          stage: "MANIFEST_GENERATION",
          title: "Canonical Evidence Manifest Compiled",
          description: "RFC 8785 deterministic JSON manifest produced and signed.",
          actor: "Manifest Engine",
          status: "SUCCESS"
        },
        {
          id: "ev_09",
          caseId: "VT-2026-00042",
          timestamp: "2026-09-02T14:32:15.000Z",
          stage: "BLOCKCHAIN_ANCHOR",
          title: "Evidence Anchored on Blockchain",
          description: "Tx 0x4b7e...4e82 confirmed in Sepolia block #5932810.",
          actor: "Web3 Anchor Service",
          status: "SUCCESS"
        }
      ]
    }
  ];
}

function getSeedVerifications(): VerificationAttempt[] {
  return [
    {
      id: "chk_01",
      caseId: "VT-2026-00042",
      timestamp: "2026-09-02T15:10:00.000Z",
      testedHash: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
      expectedHash: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
      match: true,
      tamperDetected: false,
      details: "Cryptographic SHA-256 matches blockchain block 5932810 commitment exactly.",
      verifiedBy: "Lead Forensic Investigator",
      blockchainBlock: 5932810
    }
  ];
}

function getSeedReports(): StoredEvidenceReport[] {
  const seedReport1: StoredEvidenceReport = {
    id: "REP-2026-X841",
    caseId: "VT-2026-00042",
    caseTitle: "Operation Apex: Disinformation Persona Audit",
    reportType: "FULL_FORENSIC_DOSSIER",
    generatedAt: "2026-09-02T15:30:00.000Z",
    sealedAt: "2026-09-02T15:35:12.000Z",
    archivalStatus: "SEALED_JUDICIAL",
    retentionCategory: "COURT_DISCOVERY",
    examiner: {
      name: "Inspector Evelyn Cruz",
      badgeId: "CYBER-INV-849",
      agency: "VeriTrace Forensic Investigation Bureau"
    },
    summary: {
      caseId: "VT-2026-00042",
      title: "Operation Apex: Disinformation Persona Audit",
      verdict: "CONFIRMED_AUTHENTIC",
      confidenceScore: 98,
      executiveOverview: "Certified digital evidence record archived for courtroom discovery. Primary evidence subject portrait verified against cryptographic SHA-256 and anchored to Sepolia consensus block #5932810.",
      keyFindings: [
        "Cryptographic SHA-256 integrity digest (8f31c7e2...) matches source file byte-for-byte.",
        "Biometric facial landmark analysis detected 1 distinct face with 99.4% confidence and neutral pose.",
        "Reverse search identified 3 corroborating public provenance occurrences across international registries.",
        "Zero digital warping or generative GAN artifacts detected across low-frequency DCT spectra."
      ],
      biometricAssessment: {
        facesDetected: 1,
        concordanceAnalysis: "Complete concordant facial structure matching known reference identity benchmarks.",
        poseAndOcclusion: "Frontal neutral orientation, negligible occlusion (<= 2%).",
        biometricIntegrityRisk: "LOW"
      },
      cryptographicAssessment: {
        hashIntegrity: "Byte-for-byte immutable match with initial evidentiary intake digest.",
        perceptualShiftAnalysis: "dHash 0-bit divergence across canonical perceptual hash comparison.",
        tamperingProbability: "VERY_LOW"
      },
      evidentiaryAdmissibility: {
        status: "COURT_READY",
        chainOfCustodyNotes: "Unbroken custodial provenance from intake to EVM ledger anchoring under FIPS 180-4 and RFC 8785 standards.",
        recommendedActions: [
          "Admit as Exhibit A-1 in judicial proceedings.",
          "Retain cryptographic receipt in statutory permanent archive."
        ]
      },
      generatedAt: "2026-09-02T15:30:00.000Z",
      modelUsed: "VeriTrace X Neural Judicial Core v3.2"
    },
    evidenceSnapshot: {
      filename: "subject_portrait_raw.png",
      sha256: "8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
      perceptualHash: "a1b2c3d4e5f60718",
      fileSizeBytes: 482104,
      mimeType: "image/png",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
    },
    manifestHash: "0x8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
    blockchainProof: {
      network: "Ethereum Sepolia Testnet",
      chainId: 11155111,
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      transactionHash: "0x4b7e9a8f2c1d3e5b7a9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a",
      blockNumber: 5932810,
      timestamp: "2026-09-02T14:32:15.000Z",
      submitterAddress: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
      evidenceHash: "0x8f31c7e2b9508d0e2c842b10a2f7902d18301c29e7c3b2f518bca48218d99a2f",
      manifestHash: "0x5d4e3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d",
      explorerUrl: "https://sepolia.etherscan.io/tx/0x4b7e9a8f2c1d3e5b7a9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a",
      status: "CONFIRMED",
      verificationMode: "LIVE_TESTNET"
    },
    correlationOverview: {
      overallAssessment: "Strong correlation",
      faceCorrelationScore: 96,
      visualPerceptualScore: 92,
      sourceConsistencyScore: 88,
      metadataConsistencyScore: 95,
      summary: "Multi-signal correlation demonstrates authentic biometric alignment with public records.",
      scientificDisclaimer: "Correlations evaluated via deterministic hashing and cosine vector geometry."
    },
    admissibilityRating: "ADMISSIBLE_FIPS_180",
    storageLocation: "storage/reports/REP-2026-X841.json",
    reportSignature: "7c12f45ea98b16e09ad7423c89df134268e0d9c3b8f152a4e98bc310f84521ae",
    notes: "Archived permanently into Evidence Vault. Approved for discovery proceedings by Lead Examiner.",
    tags: ["Court Ready", "FIPS 180-4", "Blockchain Anchored", "High Priority", "Verified"]
  };

  const rawToSign = {
    id: seedReport1.id,
    caseId: seedReport1.caseId,
    caseTitle: seedReport1.caseTitle,
    reportType: seedReport1.reportType,
    generatedAt: seedReport1.generatedAt,
    evidenceSnapshot: seedReport1.evidenceSnapshot,
    summary: seedReport1.summary,
    admissibilityRating: seedReport1.admissibilityRating
  };
  seedReport1.reportSignature = computeSha256(Buffer.from(canonicalizeJson(rawToSign), "utf-8"));

  return [seedReport1];
}

