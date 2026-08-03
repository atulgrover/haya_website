# myPIE & iPIE Masterclass: Official Participant Training Handbook & Lab Manual

**Author**: Hayagriva AI Legal Engineering Team  
**Target Audience**: Insolvency Professionals (IPs), Advocates, Chartered Accountants (CAs), Registered Valuers (RVs), & IPEs  
**Ecosystem Version**: iPIE MCA Platform v2026.1 / myPIE Desktop IDE v3.4.0  

---

## Table of Contents

- [Chapter 0: Sovereign Workspace Setup & myPIE IDE Architecture](#chapter-0-sovereign-workspace-setup--mypie-ide-architecture)
- [Chapter 1: Process Commencement & Statutory Timeline Clock (iPIE Stage 01)](#chapter-1-process-commencement--statutory-timeline-clock-ipie-stage-01)
- [Chapter 2: Claims Management & Multi-Class Collation Engine (iPIE Stage 02)](#chapter-2-claims-management--multi-class-collation-engine-ipie-stage-02)
- [Chapter 3: Stakeholder Governance & CoC Constitution (iPIE Stage 03)](#chapter-3-stakeholder-governance--coc-constitution-ipie-stage-03)
- [Chapter 4: VDR Records & Forensic PUFE Auditing (iPIE Stage 04)](#chapter-4-vdr-records--forensic-pufe-auditing-ipie-stage-04)
- [Chapter 5: Resolution Plan Evaluation & Form H Certification (iPIE Stage 05)](#chapter-5-resolution-plan-evaluation--form-h-certification-ipie-stage-05)
- [Chapter 6: Implementation & Monitoring Committee (iPIE Stage 06)](#chapter-6-implementation--monitoring-committee-ipie-stage-06)
- [Chapter 7: Liquidation Estate & Section 53 Waterfall Distribution (iPIE Stage 07)](#chapter-7-liquidation-estate--section-53-waterfall-distribution-ipie-stage-07)
- [Chapter 8: Compliance Management & IBBI/MCA Filings (iPIE Stage 08)](#chapter-8-compliance-management--ibbimca-filings-ipie-stage-08)
- [Chapter 9: Litigation Management & Dispute Exporter (iPIE Stage 09)](#chapter-9-litigation-management--dispute-exporter-ipie-stage-09)
- [Chapter 10: Cost Management & Process Expense Approval (iPIE Stage 10)](#chapter-10-cost-management--process-expense-approval-ipie-stage-10)

---

## Chapter 0: Sovereign Workspace Setup & myPIE IDE Architecture

### 0.1 System Architecture Overview

The Ministry of Corporate Affairs (MCA) **Integrated Platform for Insolvency Ecosystem (iPIE)** operates in tandem with your local **myPIE (Hayagriva Desktop IDE)**. While iPIE serves as the central regulatory cloud, **myPIE** acts as your private, air-gapped sovereign workspace where confidential case documents are processed locally.

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │  myPIE LOCAL 4-STEP EXECUTION ENGINE                                        │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │  1. Ingestion & Slicing     ──► Parses PDFs, Word, Excel into Markdown      │
 │  2. Monaco Audit & Editing  ──► Live Status Dots, Claims Sync, Timeline     │
 │  3. Subagent Execution      ──► @timeline, @claims, @coc, @evaluator,       │
 │                                 @avoidance, @nclt, @forms perform actions   │
 │  4. Regulator Exporter      ──► Generates cryptographically signed          │
 │                                 Ed25519 payload ready to upload back to iPIE│
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 0.2 Local Workspace Initialization

1. Launch **Hayagriva Desktop IDE**.
2. Open your case workspace directory (e.g. `~/Documents/Sample_CIRP_Matter`).
3. Verify that `InLegal-SBERT` ONNX vector pipeline pre-warms automatically in the status bar.

---

## Chapter 1: Process Commencement & Statutory Timeline Clock (iPIE Stage 01)

### 1.1 Overview & Sample Demo Files

In Stage 01, the Insolvency Professional initiates case processing upon receipt of the NCLT admission order.

* **Sample R2 Archive**: `ipie/iPIE_01_Commencement.zip`
* **Demo Files Included**:
  - `NCLT_Admission_Order_CP_IB_1024_2026.pdf` (NCLT Order admitting Corporate Debtor into CIRP)
  - `Form_FA_Withdrawal_Application.docx` (Section 12A withdrawal application template)
  - `Section_7_Petition_Excerpt.pdf` (Financial creditor default notice)

### 1.2 Ingestion & Processing

1. Drop `iPIE_01_Commencement.zip` contents into your active case folder.
2. Ingestion pipeline scans PDF text density, creates companion card `concepts/NCLT_Admission_Order.md`, and extracts the $T_0$ insolvency date (`2026-08-01`).

### 1.3 Monaco Audit & Status Dots

* Open `timeline.md` in the Monaco text editor.
* Verify auto-generated Gantt chart and statutory clock milestone markers:
  - $T_0$ (Day 0): Admission Order Date (`2026-08-01`)
  - $T_{14}$ (Day 14): Public Announcement & Claims Submission Deadline (`2026-08-15`)
  - $T_{30}$ (Day 30): 1st CoC Constitution Deadline (`2026-08-31`)
  - $T_{180}$ (Day 180): Standard CIRP Closure Deadline (`2027-01-28`)
  - $T_{330}$ (Day 330): Maximum Statutory Extension Boundary (`2027-06-27`)

### 1.4 Subagent Execution Prompts

Execute the following prompts in the chat input bar:

```bash
@nclt verify admission order
@timeline generate public announcement
```

### 1.5 Output Payload Artifact

- **File**: `Commencement_Payload_Ed25519.json` & `timeline.md`
- **Action**: Upload `Commencement_Payload_Ed25519.json` under **Haya Portal ➔ Profile ➔ iPIE Submissions** to earn `✓ Stage 01 Certified`.

---

## Chapter 2: Claims Management & Multi-Class Collation Engine (iPIE Stage 02)

### 2.1 Overview & Sample Demo Files

In Stage 02, the IP receives, parses, and collates claims submitted by Financial Creditors, Operational Creditors, Employees, and Statutory Authorities under CIRP Regulations 7–12.

* **Sample R2 Archive**: `ipie/iPIE_02_Claims.zip`
* **Demo Files Included**:
  - `Form_B_Operational_Creditor_Steel_Corp.pdf` (Form B claim for ₹45,00,000)
  - `Form_C_Financial_Creditor_State_Bank.pdf` (Form C claim for ₹120,00,00,000 with security interest details)
  - `Form_D_Workmen_Claims_Ledger.xlsx` (Workmen & employee dues multi-tab spreadsheet)

### 2.2 Ingestion & Tabular Markdown Conversion

1. Drop claim files into workspace. Multi-tab `.xlsx` workbooks are converted tab-by-tab into structured Markdown tables:
   ```markdown
   ## Sheet: Financial_Creditors
   | Creditor Name | Claimed Amount (INR) | Admitted Amount (INR) | Security Interest |
   | State Bank of India | 1,200,000,000 | 1,200,000,000 | Exclusive First Charge on Factory Land |
   | Punjab National Bank | 800,000,000 | 780,000,000 | Hypothecation of Plant & Machinery |
   ```

### 2.3 Monaco Bi-Directional Sync

1. Open `claims_registry.md` in Monaco editor.
2. Edit an admitted amount or mark `verified_by_user = 1`.
3. Saving the file synchronizes updates directly to SQLite database and `case_kv_dictionary.json`.

### 2.4 Subagent Execution Prompts

```bash
@claims collate all claims
@forms generate CIRP-2
```

### 2.5 Output Payload Artifact

- **File**: `Claims_Verification_Summary.json` & `claims_registry.md`
- **Action**: Upload to Portal to earn `✓ Stage 02 Certified`.

---

## Chapter 3: Stakeholder Governance & CoC Constitution (iPIE Stage 03)

### 3.1 Overview & Sample Demo Files

In Stage 03, the IP constitutes the Committee of Creditors (CoC), calculates voting shares, excludes related parties under Section 5(24), and issues meeting notices.

* **Sample R2 Archive**: `ipie/iPIE_03_CoC.zip`
* **Demo Files Included**:
  - `Creditor_Admitted_Claims_Summary.md` (Collated creditor table)
  - `Related_Party_Disclosures_Sec5_24.json` (Director & affiliate interest disclosures)
  - `CoC_Meeting_Notice_Skeleton.docx` (1st CoC meeting notice & agenda template)

### 3.2 Statutory Voting Share Formula

$$\text{Voting Share}_i = \frac{\text{Admitted Debt of Unrelated Creditor}_i}{\sum_{k=1}^{N} \text{Admitted Debt of All Unrelated Financial Creditors}} \times 100\%$$

* **Section 5(24) Related-Party Rule**: Any financial creditor classified as a related party of the Corporate Debtor is excluded from the denominator and assigned **0.00% voting share**.

### 3.3 Subagent Execution Prompts

```bash
@coc calculate voting share
@coc draft meeting notice
```

### 3.4 Output Payload Artifact

- **File**: `CoC_Voting_Shares_Certificate.json` & `CoC_Notice_1st_Meeting.md`
- **Action**: Upload to Portal to earn `✓ Stage 03 Certified`.

---

## Chapter 4: VDR Records & Forensic PUFE Auditing (iPIE Stage 04)

### 4.1 Overview & Sample Demo Files

In Stage 04, the IP manages the Virtual Data Room (VDR) and conducts forensic transaction audits to identify Preferential (Sec 43), Undervalued (Sec 45), Extortionate (Sec 50), and Fraudulent (Sec 66) transactions (PUFE).

* **Sample R2 Archive**: `ipie/iPIE_04_Records.zip`
* **Demo Files Included**:
  - `Audited_Balance_Sheet_FY2025.pdf` (Audited financial statements)
  - `Bank_Statement_Ledger_FY24_25.xlsx` (Transaction ledger with suspicious transfers)
  - `Transaction_Audit_Forensic_Report.pdf` (Forensic auditor findings on unrecorded asset sales)

### 4.2 Subagent Execution Prompts

```bash
@avoidance audit transactions
@im compile information memorandum
```

### 4.3 Output Payload Artifact

- **File**: `PUFE_Transactions_Audit_Report.json` & `Information_Memorandum.md`
- **Action**: Upload to Portal to earn `✓ Stage 04 Certified`.

---

## Chapter 5: Resolution Plan Evaluation & Form H Certification (iPIE Stage 05)

### 5.1 Overview & Sample Demo Files

In Stage 05, the IP evaluates submitted Resolution Plans against Section 30(2) statutory requirements, verifies Section 29A disqualification, and compiles Form H.

* **Sample R2 Archive**: `ipie/iPIE_05_Plan.zip`
* **Demo Files Included**:
  - `Resolution_Plan_Apex_Infra_Consortium.pdf` (Resolution Plan submission)
  - `Section_29A_Affidavit_Applicant.pdf` (Connected persons disclosure affidavit)
  - `Form_H_Checklist_Skeleton.md` (Regulation 39(4) Form H compliance matrix)

### 5.2 Subagent Execution Prompts

```bash
@evaluator audit resolution plan
@evaluator generate Form H
```

### 5.3 Output Payload Artifact

- **File**: `Form_H_Compliance_Certificate.json` & `Form_H_NCLT_Submission.md`
- **Action**: Upload to Portal to earn `✓ Stage 05 Certified`.

---

## Chapter 6: Implementation & Monitoring Committee (iPIE Stage 06)

### 6.1 Overview & Sample Demo Files

In Stage 06, following NCLT approval of the Resolution Plan, the IP monitors plan implementation via the Monitoring Committee (IMC).

* **Sample R2 Archive**: `ipie/iPIE_06_Implementation.zip`
* **Demo Files Included**:
  - `Monitoring_Committee_Agreement_Draft.docx` (IMC governance agreement)
  - `Resolution_Plan_Tranche_Payout_Schedule.xlsx` (Tranche distribution tracking ledger)

### 6.2 Subagent Execution Prompts

```bash
@compliance track implementation
```

### 6.3 Output Payload Artifact

- **File**: `Monitoring_Committee_Tranche_Log.json`
- **Action**: Upload to Portal to earn `✓ Stage 06 Certified`.

---

## Chapter 7: Liquidation Estate & Section 53 Waterfall Distribution (iPIE Stage 07)

### 7.1 Overview & Sample Demo Files

In Stage 07, if resolution fails, the Liquidator manages asset sales and calculates Section 53 waterfall payout priorities.

* **Sample R2 Archive**: `ipie/iPIE_07_Liquidation.zip`
* **Demo Files Included**:
  - `NCLT_Liquidation_Order.pdf` (NCLT liquidation order)
  - `Asset_Valuation_Report_Real_Estate.pdf` (Liquidation estate valuation report)
  - `Section_53_Waterfall_Distribution_Ledger.xlsx` (Waterfall distribution ledger)

### 7.2 Section 53 Priority Waterfall

$$\text{CIRP Costs} \longrightarrow \text{Workmen Dues (24m) \& Secured Creditors} \longrightarrow \text{Wages (12m)} \longrightarrow \text{Unsecured Financial Creditors} \longrightarrow \text{Statutory Dues} \longrightarrow \text{Equity}$$

### 7.3 Subagent Execution Prompts

```bash
@claims calculate waterfall
```

### 7.4 Output Payload Artifact

- **File**: `Waterfall_Distribution_Sec53.json`
- **Action**: Upload to Portal to earn `✓ Stage 07 Certified`.

---

## Chapter 8: Compliance Management & IBBI/MCA Filings (iPIE Stage 08)

### 8.1 Overview & Sample Demo Files

Stage 08 covers regulatory compliance reporting across IBBI statutory forms (CIRP-1 to CIRP-6) and MCA XBRL reporting payloads.

* **Sample R2 Archive**: `ipie/iPIE_08_Compliance.zip`
* **Demo Files Included**:
  - `IBBI_CIRP_Forms_1_to_6_Checklist.md` (IBBI filing deadline tracker)
  - `MCA_XBRL_Reporting_Schema_Sample.xml` (MCA compliance payload)

### 8.2 Subagent Execution Prompts

```bash
@forms audit compliance
```

### 8.3 Output Payload Artifact

- **File**: `IBBI_MCA_Compliance_Audit.json`
- **Action**: Upload to Portal to earn `✓ Stage 08 Certified`.

---

## Chapter 9: Litigation Management & Dispute Exporter (iPIE Stage 09)

### 9.1 Overview & Sample Demo Files

Stage 09 handles interlocutory applications, avoidance litigation petitions, and Supreme Court legal research.

* **Sample R2 Archive**: `ipie/iPIE_09_Litigation.zip`
* **Demo Files Included**:
  - `NCLT_IA_402_2026_Stay_Application.pdf` (Interlocutory Application stay petition)
  - `Supreme_Court_Precedent_CIRP_Pari_Passu.pdf` (Supreme Court judgment excerpt)

### 9.2 Supreme Court Layout Compiler (`/export-sc`)

Execute `/export-sc` command to format petitions directly into Supreme Court compliant DOCX layout (A4, 14pt Times New Roman, 1.5 line spacing, 4cm left margin).

### 9.3 Subagent Execution Prompts

```bash
@litigation draft reply
/export-sc
```

### 9.4 Output Payload Artifact

- **File**: `NCLT_Interlocutory_Application.docx`
- **Action**: Upload to Portal to earn `✓ Stage 09 Certified`.

---

## Chapter 10: Cost Management & Process Expense Approval (iPIE Stage 10)

### 10.1 Overview & Sample Demo Files

Stage 10 monitors CIRP and Liquidation process expenses under IBBI regulations for CoC cost ratification.

* **Sample R2 Archive**: `ipie/iPIE_10_Finance.zip`
* **Demo Files Included**:
  - `CIRP_Process_Expense_Ledger.xlsx` (Itemized process cost ledger)
  - `Valuer_and_Auditor_Fee_Quotations.pdf` (Fee quotations for CoC ratification)

### 10.2 Subagent Execution Prompts

```bash
@coc approve costs
@forms compile CIRP-4
```

### 10.3 Output Payload Artifact

- **File**: `CIRP_Cost_Approval_Report.json`
- **Action**: Upload to Portal under **Profile ➔ iPIE Submissions** to achieve your **10/10 iPIE Certified Insolvency Professional** credential!

---

**Congratulations!** You have completed the 10-Stage iPIE Masterclass Lab Curriculum.
