/**
 * VERITRACE X - Core Forensic & Blockchain Types
 * Strict scientific forensic taxonomy
 */

export type CaseStatus = 
  | 'ingested'
  | 'processing'
  | 'analyzed'
  | 'anchored'
  | 'verified'
  | 'tampered'
  | 'failed';

export type CorrelationLevel = 
  | 'Strong correlation'
  | 'Moderate correlation'
  | 'Weak correlation'
  | 'Insufficient evidence';

export interface FaceBoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  confidence: number;
  label?: string;
}

export interface FaceForensicData {
  facesDetected: number;
  boundingBoxes: FaceBoundingBox[];
  confidence: number;
  landmarks?: {
    leftEye?: [number, number];
    rightEye?: [number, number];
    nose?: [number, number];
    mouth?: [number, number];
  };
  embeddingFingerprint: string;
  embeddingDimension: number;
  attributes?: {
    poseEstimated?: string;
    lightingQuality?: string;
    occlusionScore?: string;
    sharpness?: string;
  };
}

export interface ReverseSearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  thumbnailUrl?: string;
  provider: string; // e.g. "Google Lens Engine" | "Gemini Vision Web Grounding" | "Local Vault"
  retrievalTimestamp: string;
  visualSimilarityScore?: number; // 0 - 100% or undefined if not computed
  faceSimilarityScore?: number; // 0 - 100% or undefined
  correlationAssessment?: CorrelationLevel;
  availability: 'Accessible' | 'Archived' | 'Restricted';
  metadataAvailable: boolean;
  publishedDate?: string;
  provenanceChain?: string[];
}

export interface EvidenceMetadata {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  sha256: string;
  perceptualHash?: string;
  colorSpace?: string;
  deviceModel?: string;
  software?: string;
  capturedAt?: string;
  exifData?: Record<string, string>;
}

export interface CorrelationReport {
  overallAssessment: CorrelationLevel;
  faceCorrelationScore?: number;
  visualPerceptualScore?: number;
  sourceConsistencyScore?: number;
  metadataConsistencyScore?: number;
  summary: string;
  scientificDisclaimer: string;
}

export interface BlockchainAnchorRecord {
  network: string;
  chainId: number;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  submitterAddress: string;
  evidenceHash: string;
  manifestHash: string;
  explorerUrl: string;
  status: 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';
  verificationMode: 'LIVE_TESTNET' | 'CRYPTOGRAPHIC_LOCAL_AUTHORITY';
}

export interface EvidenceManifest {
  caseId: string;
  evidenceId: string;
  timestamp: string;
  sha256: string;
  perceptualHash?: string;
  metadata: EvidenceMetadata;
  faceDetection: FaceForensicData;
  sources: ReverseSearchResult[];
  correlation: CorrelationReport;
  blockchain?: BlockchainAnchorRecord;
}

export interface ChainOfCustodyEvent {
  id: string;
  caseId: string;
  timestamp: string;
  stage: 
    | 'INGESTION'
    | 'HASHING'
    | 'METADATA_EXTRACTION'
    | 'FACE_ANALYSIS'
    | 'EMBEDDING_GEN'
    | 'REVERSE_SEARCH'
    | 'CORRELATION'
    | 'MANIFEST_GENERATION'
    | 'BLOCKCHAIN_ANCHOR'
    | 'VERIFICATION';
  title: string;
  description: string;
  actor: string;
  hashSnapshot?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILURE' | 'IN_PROGRESS';
}

export interface VerificationAttempt {
  id: string;
  caseId: string;
  timestamp: string;
  testedHash: string;
  expectedHash: string;
  match: boolean;
  tamperDetected: boolean;
  details: string;
  verifiedBy: string;
  blockchainBlock?: number;
}

export interface ForensicExecutiveSummary {
  caseId?: string;
  title: string;
  verdict: 'CONFIRMED_AUTHENTIC' | 'PROBABLE_DERIVATIVE' | 'TAMPER_SUSPECTED' | 'INCONCLUSIVE' | 'STRONG_CORRELATION';
  confidenceScore: number;
  executiveOverview: string;
  keyFindings: string[];
  biometricAssessment?: {
    facesDetected: number;
    concordanceAnalysis: string;
    poseAndOcclusion: string;
    biometricIntegrityRisk: 'LOW' | 'MODERATE' | 'HIGH';
  };
  cryptographicAssessment: {
    hashIntegrity: string;
    perceptualShiftAnalysis: string;
    tamperingProbability: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  };
  evidentiaryAdmissibility: {
    status: 'COURT_READY' | 'PRELIMINARY_EVIDENCE' | 'REQUIRES_FURTHER_AUTHENTICATION';
    chainOfCustodyNotes: string;
    recommendedActions: string[];
  };
  generatedAt: string;
  modelUsed: string;
}

export interface ForensicCase {
  id: string; // e.g. VT-2026-00042
  title: string;
  createdAt: string;
  updatedAt: string;
  status: CaseStatus;
  evidenceFile: {
    originalName: string;
    url: string;
    sha256: string;
    sizeBytes: number;
    mimeType: string;
  };
  metadata: EvidenceMetadata;
  faceData?: FaceForensicData;
  searchResults: ReverseSearchResult[];
  correlation?: CorrelationReport;
  manifest?: EvidenceManifest;
  blockchainAnchor?: BlockchainAnchorRecord;
  verificationHistory: VerificationAttempt[];
  timeline: ChainOfCustodyEvent[];
}

export interface DashboardMetrics {
  activeInvestigations: number;
  evidenceItems: number;
  sourcesDiscovered: number;
  blockchainAnchors: number;
  verifiedRecords: number;
  integrityFailures: number;
}

export interface SystemHealthStatus {
  visionEngine: { status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; latencyMs: number; details: string };
  searchProvider: { status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; provider: string; details: string };
  database: { status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; records: number; details: string };
  blockchainRpc: { status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; network: string; details: string };
  smartContract: { status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; address: string; details: string };
  storage: { status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; path: string; details: string };
}

export interface StoredEvidenceReport {
  id: string; // e.g. "REP-2026-X841" or "REP-VT-2026-00042"
  caseId: string;
  caseTitle: string;
  reportType: 'FULL_FORENSIC_DOSSIER' | 'JUDICIAL_EVIDENCE_BUNDLE' | 'CHAIN_OF_CUSTODY_CERT' | 'BIOMETRIC_EVALUATION';
  generatedAt: string;
  sealedAt?: string;
  archivalStatus: 'ARCHIVED_ACTIVE' | 'SEALED_JUDICIAL' | 'PERMANENT_COLD_STORAGE' | 'FLAGGED_TAMPER';
  retentionCategory: 'COURT_DISCOVERY' | 'COLD_CASE' | 'STATUTORY_AUDIT' | 'RESEARCH_REFERENCE';
  examiner: {
    name: string;
    badgeId: string;
    agency: string;
  };
  summary: ForensicExecutiveSummary;
  evidenceSnapshot: {
    filename: string;
    sha256: string;
    perceptualHash?: string;
    fileSizeBytes: number;
    mimeType: string;
    url?: string;
  };
  manifestHash: string;
  blockchainProof?: BlockchainAnchorRecord;
  correlationOverview?: CorrelationReport;
  admissibilityRating: 'ADMISSIBLE_FIPS_180' | 'CONDITIONAL_CORROBORATION' | 'EVIDENTIARY_HOLD';
  storageLocation: string; // e.g. "storage/reports/REP-2026-X841.json"
  reportSignature: string; // SHA-256 cryptographic digest of report payload
  notes?: string;
  tags: string[];
}

