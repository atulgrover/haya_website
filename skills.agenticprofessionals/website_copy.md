# HAYAGRIVA Website & Architecture Copy

> **The Sovereign Legal Development Environment (LDE) & IPE Platform**

---

## 🏛️ The 3×3 Core Architecture Model

### Section 1: In-App Workspace Sections (Inside Your Case Folder)

1. **📁 Case Data & Facts (Ground Truth Layer)**:
   - Instant multi-format file ingestion (PDF, Word, Excel, Financial Sheets).
   - Companion markdown card slicing (`concepts/<doc>/`).
   - Auto-extracted key-value facts dictionary (`case_kv_dictionary.json`).

2. **⚖️ Professional Audits & Human Inputs (Verification Layer)**:
   - Live status dot indicators (`Reviewed`, `Needs Verification`, `AI Synthesized`).
   - Bi-directional Monaco table sync to SQLite (`claims_registry.md`, `avoidance_ledger.md`).
   - Active-Context Control Matrix for dynamic RAG scope selection (`concepts/active_rag_docs.json`).

3. **🤖 AI Enhancements & Exporters (Synthesis Layer)**:
   - Specialized Node.js subagents (`@Document`, `@Advisor`, `@Forms`).
   - Dual-model RRF RAG retrieval (InLegal-SBERT + Finance-Embeddings).
   - 1-Click Supreme Court layout compiler (`/export-sc`).

---

### Section 2: Downloadable Portal Plug-ins (Sovereign Desktop Packs)

1. **🧠 Models Pack (Offline AI Engines)**:
   - ONNX Embeddings (`InLegal-SBERT` & `Finance-Embeddings`).
   - Quantized `LegalParam-2.9B.gguf` & `FinanceParam-2.9B.gguf` running locally via `llama-server`.

2. **📚 Encrypted Vaults Pack (Statutory & Precedent Libraries)**:
   - AES-256 encrypted `laws.vlt` (IBC 2016, Companies Act, NCLT Rules).
   - Supreme Court & NCLAT judgment lookup with instant Monaco hover citations (`/law`, `/case`).

3. **⚡ Specialist Agents Pack (Domain Capabilities)**:
   - Insolvency Auditor Agent, MCA Forms Compliance Agent, Petition Drafting Agent.

---

## 🎯 Targeted Product Offerings & Packaging Matrix

### 🏛️ 1. Haya_Legal (Legal Edition for Advocates & Law Firms)
* **Target Professionals**: Advocates, Barristers, Corporate Counsel, Law Firms.
* **AI Model Footprint (2 Models)**:
  1. `InLegal-SBERT` (768-dim ONNX Vector Embedder)
  2. `LegalParam-2.9B.gguf` (Q4_K_M 2.9B Generative LLM)
* **Encrypted Vault Suite**: `laws`, `cases`, `ibc`, `general`, `acord_clauses` (126k clauses), `rera`, `debt_recovery`, `documents_pleadings`.
* **Subagent Extension Pack**: `@advisor`, `@document`, `@nclt`, `@precedent`, `@counter`, `@litigation`, `@strength`, `@witness`.
* **Signature Capability**: Instant precedent matching, court petition drafting, and 1-Click Supreme Court layout compiler (`/export-sc`).

### 📊 2. Haya_Finance (Finance & CIRP Edition for CAs & RPs)
* **Target Professionals**: Chartered Accountants, Insolvency Resolution Professionals (IPs), Forensic Auditors, Valuation Experts.
* **AI Model Footprint (3 Models)**:
  1. `InLegal-SBERT` (768-dim ONNX Vector Embedder – for Data Vault lookups)
  2. `Finance-Embeddings` (768-dim ONNX Vector Embedder – for Excel ledgers & trial balances)
  3. `FinanceParam-2.9B.gguf` (Q4_K_M 2.9B Generative LLM)
* **Encrypted Vault Suite**: `forms`, `documents_ibc`, `documents_corporate`, `documents_tax_conveyancing`, `cuad_benchmark`.
* **Subagent Extension Pack**: `@coc` (Creditor Voting Share & Meeting Coordinator), `@evaluator` (Resolution Plan & Form H Auditor), `@claims` (Claim Verification), `@timeline` ($T_0 \rightarrow T_{330}$ Manager), `@avoidance` (Sections 43, 45, 50, 66 PUFE Auditor).
* **Signature Capability**: Bank statement reconciliation, financial claim admission, creditor voting share math, PUFE forensic audit, and Form H compliance certificates.

