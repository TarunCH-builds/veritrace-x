// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VeriTraceAnchor
 * @notice Cryptographic Evidence Anchoring Contract for VeriTrace X
 * @dev Stores cryptographic commitments (SHA-256 / Keccak-256) of forensic evidence
 *      and manifests. Sensitive biometric vectors and raw images are NEVER stored on-chain.
 */
contract VeriTraceAnchor {
    struct EvidenceRecord {
        bytes32 evidenceHash;   // Cryptographic hash (SHA-256) of original evidence
        bytes32 manifestHash;   // Cryptographic hash of canonical evidence manifest
        string caseId;          // Forensic case identifier (e.g. VT-2026-00042)
        uint256 timestamp;      // Block timestamp at time of anchoring
        address submitter;      // Address of investigator or authorized gateway
        bool isRevoked;         // Revocation flag for invalidated investigations
    }

    // Evidence Hash => EvidenceRecord
    mapping(bytes32 => EvidenceRecord) public evidenceRecords;

    // Case ID => Evidence Hash
    mapping(string => bytes32) public caseToEvidenceHash;

    // Total anchored count
    uint256 public totalAnchoredCount;

    // Authorized contract owner/admin
    address public owner;

    // Events for transparent indexing
    event EvidenceAnchored(
        string indexed caseId,
        bytes32 indexed evidenceHash,
        bytes32 manifestHash,
        uint256 timestamp,
        address indexed submitter
    );

    event EvidenceRevoked(
        string indexed caseId,
        bytes32 indexed evidenceHash,
        string reason,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "VeriTraceAnchor: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Anchors a cryptographic commitment for a forensic investigation
     * @param evidenceHash The SHA-256 hash of the evidence file
     * @param manifestHash The SHA-256 hash of the canonical forensic manifest
     * @param caseId Unique forensic case identifier
     */
    function anchorEvidence(
        bytes32 evidenceHash,
        bytes32 manifestHash,
        string calldata caseId
    ) external returns (bool) {
        require(evidenceHash != bytes32(0), "VeriTraceAnchor: invalid evidence hash");
        require(manifestHash != bytes32(0), "VeriTraceAnchor: invalid manifest hash");
        require(bytes(caseId).length > 0, "VeriTraceAnchor: empty case identifier");
        require(evidenceRecords[evidenceHash].timestamp == 0, "VeriTraceAnchor: evidence already anchored");

        evidenceRecords[evidenceHash] = EvidenceRecord({
            evidenceHash: evidenceHash,
            manifestHash: manifestHash,
            caseId: caseId,
            timestamp: block.timestamp,
            submitter: msg.sender,
            isRevoked: false
        });

        caseToEvidenceHash[caseId] = evidenceHash;
        totalAnchoredCount++;

        emit EvidenceAnchored(
            caseId,
            evidenceHash,
            manifestHash,
            block.timestamp,
            msg.sender
        );

        return true;
    }

    /**
     * @notice Verifies if an evidence hash matches an anchored record
     * @param evidenceHash The cryptographic hash to verify
     */
    function verifyEvidence(bytes32 evidenceHash)
        external
        view
        returns (
            bool exists,
            bytes32 manifestHash,
            string memory caseId,
            uint256 timestamp,
            address submitter,
            bool isRevoked
        )
    {
        EvidenceRecord memory record = evidenceRecords[evidenceHash];
        if (record.timestamp == 0) {
            return (false, bytes32(0), "", 0, address(0), false);
        }
        return (
            true,
            record.manifestHash,
            record.caseId,
            record.timestamp,
            record.submitter,
            record.isRevoked
        );
    }

    /**
     * @notice Retrieves evidence record by Case ID
     */
    function getEvidenceByCase(string calldata caseId)
        external
        view
        returns (
            bool exists,
            bytes32 evidenceHash,
            bytes32 manifestHash,
            uint256 timestamp,
            address submitter,
            bool isRevoked
        )
    {
        bytes32 hash = caseToEvidenceHash[caseId];
        if (hash == bytes32(0)) {
            return (false, bytes32(0), bytes32(0), 0, address(0), false);
        }
        EvidenceRecord memory record = evidenceRecords[hash];
        return (
            true,
            record.evidenceHash,
            record.manifestHash,
            record.timestamp,
            record.submitter,
            record.isRevoked
        );
    }
}
