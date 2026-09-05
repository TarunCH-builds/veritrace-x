<div align="center">

# 🔐 VERITRACE X

### AI Visual Forensics & Verifiable Evidence Intelligence Platform

**Transforming digital images into structured, analyzable and cryptographically verifiable evidence.**

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Vision-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Ethereum](https://img.shields.io/badge/EVM-Blockchain-627EEA?logo=ethereum&logoColor=white)](https://ethereum.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<br/>

**AI Analysis • Digital Forensics • Evidence Correlation • Cryptographic Integrity • Blockchain Verification**

</div>

---

## 🧭 Overview

**VeriTrace X** is an AI-powered visual forensics and evidence intelligence platform designed to help investigators analyze, correlate and verify digital image evidence.

Instead of treating an uploaded image as simply a file, VeriTrace X builds a structured **evidence lifecycle** around it:

```text
IMAGE
  ↓
EVIDENCE INGESTION
  ↓
CRYPTOGRAPHIC FINGERPRINTING
  ↓
AI VISUAL / FACE ANALYSIS
  ↓
WEB SOURCE DISCOVERY
  ↓
CROSS-CASE CORRELATION
  ↓
EVIDENCE MANIFEST
  ↓
BLOCKCHAIN / CRYPTOGRAPHIC ANCHOR
  ↓
INTEGRITY VERIFICATION
  ↓
FORENSIC REPORT
---

🎯 What VeriTrace X Solves

Digital images are increasingly important sources of evidence in investigations, journalism, cybersecurity, fraud analysis and incident response.

However, determining whether an image is trustworthy is rarely as simple as opening the file.

Investigators may need to answer questions such as:

- Where did this image originate?
- Has the file been modified?
- What information is embedded in the image?
- Are there visually related or matching faces?
- Can related evidence be correlated?
- What sources reference the same visual content?
- Can the evidence state be independently verified later?

VeriTrace X brings these investigation steps together into a single evidence-oriented workflow.

---

⚡ Core Capabilities

Capability| Description
🧠 AI Visual Analysis| Analyze uploaded images using AI vision capabilities
👤 Face Analysis| Extract and analyze facial information from visual evidence
🔎 Evidence Discovery| Explore potentially related information and sources
🧬 Cryptographic Fingerprinting| Generate deterministic fingerprints for evidence integrity
🔗 Evidence Correlation| Connect related evidence across investigations
📋 Evidence Manifests| Maintain structured records of analyzed evidence
⛓️ Blockchain Anchoring| Anchor evidence-related integrity information on EVM-compatible infrastructure
✅ Verification| Compare evidence against previously recorded integrity information
📊 Investigation Dashboard| Present evidence and investigation information in a centralized interface
📄 Forensic Reporting| Organize analysis results into investigation-ready reports

---

🧠 AI Visual Intelligence

VeriTrace X integrates Google Gemini vision capabilities to transform raw visual input into structured analytical information.

A typical workflow can be represented as:

┌───────────────────────┐
│     IMAGE EVIDENCE    │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│    AI VISION ENGINE   │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ VISUAL OBSERVATIONS   │
│                       │
│ • Objects             │
│ • Scene information   │
│ • Visible details     │
│ • Facial information  │
│ • Contextual signals  │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ STRUCTURED EVIDENCE   │
└───────────────────────┘

The purpose of AI analysis is to assist investigators in extracting useful information from visual evidence rather than replacing human forensic judgment.

---

👤 Facial Evidence Analysis

Where facial analysis is enabled, VeriTrace X can process visual facial information as part of an investigation workflow.

Potential outputs can include:

- Detected faces
- Facial regions
- Face-related observations
- Evidence associations
- Cross-evidence relationships

Important distinction

AI-generated visual observations should be treated as investigative leads, not automatically as definitive identification or legal conclusions.

Human review and appropriate forensic methodology remain essential.

---

🔎 Evidence Discovery

VeriTrace X is designed to help investigators move beyond a single isolated image.

Evidence can be examined alongside potentially related sources and contextual information to help construct a broader picture of an investigation.

                 IMAGE
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
     SOURCE      VISUAL     CONTEXT
    DISCOVERY    SIGNALS    SIGNALS
        │          │          │
        └──────────┼──────────┘
                   ↓
             CORRELATION
                   ↓
          INVESTIGATION GRAPH

This enables an evidence-first approach rather than simply performing one-off image analysis.

---

🧬 Cryptographic Evidence Fingerprinting

Integrity is a fundamental requirement when working with digital evidence.

VeriTrace X uses cryptographic fingerprinting to create a reproducible representation of evidence.

                    FILE
                     │
                     ▼
             ┌───────────────┐
             │  HASH ENGINE   │
             └───────┬───────┘
                     │
                     ▼
             CRYPTOGRAPHIC
              FINGERPRINT
                     │
              ┌──────┴──────┐
              ↓             ↓
          STORE /          VERIFY /
           ANCHOR          COMPARE

If the contents of a file change, its cryptographic fingerprint will normally change as well.

This provides a practical mechanism for detecting content-level modifications.

---

⛓️ Blockchain Verification Layer

VeriTrace X can use EVM-compatible blockchain infrastructure to provide an additional verification layer for evidence integrity information.

Instead of placing the complete evidence file on-chain, the system can use a cryptographic representation of the evidence.

Evidence File
     │
     ▼
Cryptographic Hash
     │
     ▼
Evidence Manifest
     │
     ▼
Blockchain Anchor
     │
     ▼
Immutable Reference
     │
     ▼
Future Verification

Why blockchain?

Blockchain anchoring can provide:

- Tamper-evident public records
- Independent timestamping infrastructure
- Persistent verification references
- Reduced dependence on a single database
- Transparent verification of anchored information

«Blockchain does not automatically prove that evidence is authentic. It can provide evidence that a particular digital fingerprint was recorded at a particular point in time. Authenticity, provenance and legal admissibility require additional forensic controls.»

---

📋 Evidence Manifest

Each investigation can be represented through a structured evidence manifest.

Example:

{
  "evidenceId": "VX-2026-001",
  "fileName": "evidence-image.jpg",
  "fileType": "image/jpeg",
  "fileSize": "2.4 MB",
  "hashAlgorithm": "SHA-256",
  "fingerprint": "…",
  "analysisStatus": "completed",
  "verificationStatus": "verified"
}

The manifest acts as a structured representation of the evidence state and its associated analysis information.

---

🔗 Cross-Case Evidence Correlation

Investigations rarely consist of a single artifact.

VeriTrace X is designed to support relationships between:

CASE
 │
 ├── Evidence A
 │      ├── Hash
 │      ├── AI Analysis
 │      └── Sources
 │
 ├── Evidence B
 │      ├── Hash
 │      ├── AI Analysis
 │      └── Sources
 │
 └── Evidence C
        ├── Hash
        ├── AI Analysis
        └── Sources

Correlating evidence can help investigators identify relationships that may not be obvious when each artifact is examined independently.

---

📊 Investigation Dashboard

The dashboard provides a centralized view of the investigation environment.

Designed around key investigation signals:

┌─────────────────────────────────────────────────────┐
│                  VERITRACE X                        │
├──────────────┬──────────────┬───────────────────────┤
│   EVIDENCE   │  VERIFIED    │    INVESTIGATIONS     │
│      24      │      19      │          06           │
├──────────────┴──────────────┴───────────────────────┤
│                                                     │
│              INVESTIGATION ACTIVITY                │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Recent Evidence                                     │
│                                                     │
│ ✓ Evidence analyzed                                 │
│ ✓ Fingerprint generated                             │
│ ✓ Verification completed                            │
│ ✓ Investigation updated                             │
└─────────────────────────────────────────────────────┘

The exact metrics displayed depend on the application's current implementation.

---

🏗️ System Architecture

                         ┌───────────────────┐
                         │       USER        │
                         │ Investigator      │
                         └─────────┬─────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │     REACT FRONTEND       │
                    │                          │
                    │ Dashboard               │
                    │ Evidence Workspace      │
                    │ Analysis Interface      │
                    │ Verification UI         │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      EXPRESS API         │
                    │                          │
                    │ Evidence Management     │
                    │ Analysis Requests        │
                    │ Verification Logic       │
                    └────────────┬─────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
             ▼                   ▼                   ▼
    ┌────────────────┐  ┌─────────────────┐  ┌────────────────┐
    │  GEMINI VISION │  │  CRYPTOGRAPHIC  │  │   EVM /        │
    │      AI        │  │     ENGINE      │  │  BLOCKCHAIN    │
    └────────────────┘  └─────────────────┘  └────────────────┘
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │   EVIDENCE MANIFESTS     │
                    │   INVESTIGATION DATA     │
                    └──────────────────────────┘

---

🔄 End-to-End Evidence Lifecycle

┌────────────┐
│   UPLOAD   │
└─────┬──────┘
      ↓
┌────────────┐
│   HASH     │
└─────┬──────┘
      ↓
┌────────────┐
│ AI ANALYZE │
└─────┬──────┘
      ↓
┌────────────┐
│  CORRELATE │
└─────┬──────┘
      ↓
┌────────────┐
│  MANIFEST  │
└─────┬──────┘
      ↓
┌────────────┐
│   ANCHOR   │
└─────┬──────┘
      ↓
┌────────────┐
│  VERIFY    │
└─────┬──────┘
      ↓
┌────────────┐
│   REPORT   │
└────────────┘

---

🧰 Technology Stack

Frontend

- ⚛️ React 19
- 📘 TypeScript 5.8
- ⚡ Vite 6

Backend

- 🟢 Node.js
- 🚂 Express

Artificial Intelligence

- ✨ Google Gemini
- AI Vision Analysis

Blockchain

- ⛓️ EVM-compatible infrastructure
- Ethereum ecosystem
- Smart-contract based verification workflow

Security

- 🔐 Cryptographic hashing
- Evidence fingerprinting
- Integrity verification
- Evidence manifests

---

📂 Project Architecture

VeriTrace-X/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── ...
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── controllers/
│   ├── middleware/
│   └── ...
│
├── contracts/
│   └── ...
│
├── public/
│
├── .env.example
├── package.json
├── vite.config.*
└── README.md

«Directory names may differ depending on the current repository structure.»

---

⚙️ Local Installation

Requirements

Before running VeriTrace X locally, install:

- Node.js 18+
- npm
- Git
- A modern Chromium-based browser or equivalent

---

1. Clone the Repository

git clone https://github.com/YOUR-USERNAME/VeriTrace-X.git
cd VeriTrace-X

---

2. Install Dependencies

If the project uses a single package configuration:

npm install

If frontend and backend have separate package files:

cd frontend
npm install

cd ../backend
npm install

---

3. Configure Environment Variables

Create the required environment file based on the project's ".env.example".

Typical configuration may include:

GEMINI_API_KEY=your_api_key

For blockchain-enabled functionality, configure the environment variables required by the project's blockchain implementation.

⚠️ Never commit secrets

Do not commit:

.env
private keys
wallet seed phrases
API keys
RPC credentials
production secrets

Add sensitive files to ".gitignore".

---

▶️ Running the Application

Start the frontend:

npm run dev

If the backend is separate:

npm run server

or use the backend's configured start command.

The terminal will display the actual local URL provided by Vite or the backend.

«VeriTrace X intentionally does not include a fake live-demo URL in this README. Run the project locally to access the application.»

---

🧪 Verification Workflow

A basic integrity test can be performed using a controlled test image.

01 — Upload

Import an authorized test image.

02 — Fingerprint

Generate its cryptographic fingerprint.

03 — Analyze

Run the AI visual analysis workflow.

04 — Record

Create or update the evidence manifest.

05 — Verify

Run verification against the previously recorded fingerprint.

06 — Modify Test Evidence

Make a controlled change to the test image.

07 — Verify Again

The fingerprint should change when the file contents change.

ORIGINAL
SHA-256 → ABC123...

        ↓ MODIFY

CURRENT
SHA-256 → XYZ789...

        ↓

⚠ INTEGRITY MISMATCH

This provides a simple demonstration of the cryptographic integrity layer.

---

🧪 Security Testing Principles

When testing VeriTrace X:

- Use synthetic or authorized evidence
- Never upload confidential evidence to third-party AI services without authorization
- Never expose API keys
- Never expose blockchain private keys
- Use dedicated development wallets
- Use test networks during development
- Validate AI-generated findings manually
- Maintain appropriate evidence-handling procedures

---

🔐 Security Considerations

VeriTrace X handles potentially sensitive digital artifacts, so security should remain a core development priority.

Recommended practices

Secrets

Store credentials in environment variables rather than source code.

Evidence

Avoid unnecessary duplication of sensitive evidence.

Access

Implement authentication and authorization before production deployment.

AI Processing

Understand the privacy and data-handling implications of external AI services.

Blockchain

Never use personal wallet private keys for application development.

Storage

Use secure storage controls for real-world forensic evidence.

---

🚀 Roadmap

VeriTrace X is designed as an extensible platform.

🔎 Forensic Intelligence

- [ ] Advanced image metadata extraction
- [ ] EXIF analysis
- [ ] Image manipulation indicators
- [ ] Advanced visual similarity
- [ ] Duplicate evidence detection
- [ ] Video evidence analysis
- [ ] Document evidence analysis

🧠 AI

- [ ] Multi-model forensic analysis
- [ ] Automated anomaly detection
- [ ] Explainable AI findings
- [ ] Evidence summarization
- [ ] Investigation assistance

🔗 Evidence Infrastructure

- [ ] Advanced chain-of-custody workflows
- [ ] Evidence timeline visualization
- [ ] Immutable audit records
- [ ] Advanced blockchain anchoring
- [ ] Evidence verification portal

📊 Investigation

- [ ] Investigation graph visualization
- [ ] Advanced evidence correlation
- [ ] Automated forensic reports
- [ ] Exportable investigation packages
- [ ] Role-based investigator access

---

🏆 Project Highlights

VeriTrace X demonstrates the integration of multiple modern technologies into one security-focused application:

       ┌────────────────────────────────┐
       │       VERITRACE X              │
       ├────────────────────────────────┤
       │                                │
       │   🤖 AI VISION                 │
       │        +                       │
       │   🔎 DIGITAL FORENSICS         │
       │        +                       │
       │   🔐 CRYPTOGRAPHY              │
       │        +                       │
       │   🔗 BLOCKCHAIN                │
       │        +                       │
       │   ⚛️ MODERN WEB ENGINEERING    │
       │                                │
       └────────────────────────────────┘

The project demonstrates practical engineering across:

- Artificial Intelligence
- Computer Vision
- Digital Forensics
- Cryptography
- Blockchain
- Full-Stack Development
- API Integration
- Evidence Management
- Security Engineering

---

📸 Screenshots

Screenshots of the application can be added here as the project evolves.

Recommended screenshots:

1. Main Dashboard
2. Evidence Upload
3. AI Analysis
4. Evidence Details
5. Verification Result
6. Blockchain Verification
7. Investigation View

Example structure:

docs/
└── screenshots/
    ├── dashboard.png
    ├── evidence-analysis.png
    ├── verification.png
    └── investigation.png

Then reference only screenshots that actually exist in the repository.

---

🤝 Contributing

Contributions are welcome.

Development Workflow

git checkout -b feature/your-feature

Make your changes, test them locally, then:

git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature

Open a Pull Request describing:

- What changed
- Why it was needed
- How it was tested
- Any limitations or known issues

---

🐛 Issues & Feature Requests

If you encounter a bug or have an improvement idea, open a GitHub Issue with:

- Clear description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots or logs where appropriate
- Environment details

---

⚖️ Responsible Use

VeriTrace X is intended for:

- Authorized digital-forensics investigations
- Cybersecurity research
- Educational purposes
- Security laboratories
- Authorized evidence analysis

Do not analyze, collect, or process digital evidence without appropriate authorization.

AI-generated observations should not be treated as definitive forensic conclusions without appropriate human validation and forensic methodology.

---

📜 License

This project is released under the MIT License.

See ""LICENSE"" (LICENSE) for details.

---

👨‍💻 Author

Tarun C H

B.Tech — Information Science & Engineering

Building at the intersection of:

AI × Cybersecurity × Digital Forensics × Software Engineering

---

⭐ Support the Project

If VeriTrace X is useful, interesting, or inspires you:

⭐ Star the repository

🍴 Fork the project

🐛 Report an issue

💡 Suggest an improvement

🤝 Contribute

---

<div align="center">🔐 VERITRACE X

AI Visual Forensics & Verifiable Evidence Intelligence

Analyze • Correlate • Fingerprint • Verify

Built to explore how AI, cryptography and blockchain can work together to strengthen digital evidence workflows.

<br/>© 2026 VeriTrace X

</div>
