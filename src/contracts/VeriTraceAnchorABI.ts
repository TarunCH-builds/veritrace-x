export const VERITRACE_ANCHOR_ABI = [
  "constructor()",
  "event EvidenceAnchored(string indexed caseId, bytes32 indexed evidenceHash, bytes32 manifestHash, uint256 timestamp, address indexed submitter)",
  "event EvidenceRevoked(string indexed caseId, bytes32 indexed evidenceHash, string reason, uint256 timestamp)",
  "function anchorEvidence(bytes32 evidenceHash, bytes32 manifestHash, string calldata caseId) external returns (bool)",
  "function verifyEvidence(bytes32 evidenceHash) external view returns (bool exists, bytes32 manifestHash, string memory caseId, uint256 timestamp, address submitter, bool isRevoked)",
  "function getEvidenceByCase(string calldata caseId) external view returns (bool exists, bytes32 evidenceHash, bytes32 manifestHash, uint256 timestamp, address submitter, bool isRevoked)",
  "function totalAnchoredCount() external view returns (uint256)",
  "function owner() external view returns (address)"
] as const;

export const DEFAULT_ANCHOR_BYTECODE = "0x608060405234801561001057600080fd5b5033600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610a008061005a6000396000f3";
