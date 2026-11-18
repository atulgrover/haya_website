# 📘 HAYA PORTAL — Administrator & Operational Handbook

Welcome to the **Haya Portal** operational guide. This handbook details how to configure, run, manage, and deploy the Haya Portal server, user database, Ed25519 cryptographic license generator, asset downloads hub, and Cloudflare integration.

---

## 📐 1. System Overview

Haya Portal is the central web application and API service supporting the **Hayagriva Private Legal AI** ecosystem:

- **Public Marketing & Documentation**: Landing page (`index.html`) featuring product capabilities and the **iPIE MCA Gateway Workflow**.
- **Customer Portal**: Auth & Account Dashboard (`login.html` & `dashboard.html`).
- **Cryptographic License Issuer**: Server-side **Ed25519** key-pair generator signing offline license tokens for Hayagriva Desktop.
- **Payment Gateway**: Integrated Razorpay (INR) and Stripe (USD) checkout endpoints.
- **Asset Distribution Hub**: Tier-gated streaming distribution for `.vlt` agent packs and `.gguf` AI models (`HayaParam-7B`, `HayaParam-14B`).

---

## 🚀 2. Server Setup & Local Execution

### Directory Structure
```
/Users/atulgrover/Desktop/haya_portal/
├── index.html                   # Public Landing Page & iPIE Workflow
├── login.html                   # Auth Modal (Login Only)
├── dashboard.html               # Customer Dashboard & License Box
├── ADMIN_HANDBOOK.md            # This Operations Guide
├── package.json
└── server/
    ├── server.js                # Express API Entry Point (Port 3000)
    ├── db.js                    # SQLite Connection (WAL Mode)
    ├── portal_database.db       # SQLite Database File
    ├── keys/
    │   ├── ed25519_private.pem  # Server License Private Key
    │   └── ed25519_public.pem   # Public Key for Hayagriva Desktop
    ├── utils/
    │   └── license-signer.js    # Base64URL Ed25519 License Signer
    └── routes/
        ├── auth.js              # Auth & JWT Sessions
        ├── license.js           # License Key Generator
        ├── downloads.js         # Vault & Model Downloads Hub
        └── payments.js          # Razorpay / Stripe Payments
```

### Starting the Server Locally
```bash
cd /Users/atulgrover/Desktop/haya_portal
npm start
```
The server will start at `http://localhost:3000` and output:
```
=======================================================
🚀 HAYA PORTAL Server running at http://localhost:3000
=======================================================
```

---

## ☁️ 3. Cloudflare Deployment Guide

### Method A: Deploy Frontend to Cloudflare Pages (Recommended)

1. **Install Cloudflare Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```
2. **Log into Cloudflare**:
   ```bash
   wrangler login
   ```
3. **Deploy from your Portal folder**:
   ```bash
   cd /Users/atulgrover/Desktop/haya_portal
   npx wrangler pages deploy . --project-name=haya-portal
   ```
   *Your portal frontend will be instantly live on `https://haya-portal.pages.dev`.*

### Method B: Cloudflare Tunnel for Node.js + SQLite Backend

To expose the live Express server (`server.js`) and SQLite database through Cloudflare's secure CDN & SSL shield:

1. **Install `cloudflared`**:
   ```bash
   brew install cloudflared
   ```
2. **Log in & Run Tunnel**:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel run --url http://localhost:3000
   ```
   *Cloudflare will provide an encrypted HTTPS URL (or route your domain `portal.hayagriva.legal`).*

---

## 🔑 4. Ed25519 License Key Management

### How Licenses Work
1. The server maintains an **Ed25519 Private Key** (`server/keys/ed25519_private.pem`).
2. When a user requests a key or purchases a subscription, `generateLicenseKey(payload)` signs the JSON payload.
3. Envelope format: `<base64url(payload)>.<base64url(signature)>`
4. The user copies this string into **Hayagriva Desktop Settings ➔ Marketplace ➔ Activate**.
5. Hayagriva Desktop verifies the signature **100% offline** using the embedded **Ed25519 Public Key** (`license-validator.js`).

### Manually Generating a License String via CLI
```bash
node -e "
  const { generateLicenseKey } = require('./server/utils/license-signer');
  console.log(generateLicenseKey({
    sub: 'user@firm.com',
    tier: 'enterprise',
    expiresAt: '2027-12-31',
    gracePeriodDays: 30
  }));
"
```

---

## 💳 5. Payment Gateway Configuration

### Environment Variables (`.env`)
Create a `.env` file in the root directory:
```env
PORT=3000
JWT_SECRET=YOUR_PRODUCTION_JWT_SECRET_KEY_2026
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxx
```

### Payment Tiers & Pricing
- **Starter (Free)**: Access to 2.9B LLMs and basic legal vault subagents.
- **Professional (₹4,999/mo)**: Access to HayaParam 7B LLM (24K context), custom vault downloads, priority updates.
- **Enterprise (₹14,999/mo)**: Access to HayaParam 14B LLM (64K context), multi-user firm licensing, and iPIE MCA Sync Gateway.

---

## 🗄️ 6. Database Administration (SQLite)

The database file is located at `server/portal_database.db`.

### Table Schemas
- `users`: User profiles, email, password hash, firm name, IP registration number.
- `subscriptions`: User subscription tiers (`starter`, `professional`, `enterprise`), transaction IDs, expiration dates.
- `licenses`: Historical log of issued Ed25519 license keys.
- `download_logs`: Timestamped audit trail of asset downloads.

### Inspecting Database Records via Node
```bash
node -e "
  const db = require('./server/db');
  console.log(db.prepare('SELECT id, email, full_name FROM users').all());
"
```

---

## 🛠️ 7. Troubleshooting & FAQ

- **Issue**: `Cannot find module 'express'`
  - **Fix**: Run `npm install` inside the `haya_portal` folder.
- **Issue**: Ed25519 Key pair missing
  - **Fix**: The server automatically generates a fresh KeyPair in `server/keys/` upon initial launch.
- **Issue**: Desktop validation failure
  - **Fix**: Ensure the public key in Hayagriva Desktop's `backend/lib/utils/license-validator.js` matches `server/keys/ed25519_public.pem`.

---

---

## 📦 8. Client Vaults & Legal Precedents Distribution Catalog

Hayagriva IDE distributes encrypted offline client vaults (`.vlt.data` with `inlegal-sbert` 768-dim semantic embeddings) built via the Master Vault Factory (`haya_ide_vault_code`). All assets are registered in `latest.json` and hosted on the portal release CDN.

### 8.1 Active Production Vaults Inventory (Week 37 / Sept 2026)

| Vault Package | Archive Name | Compressed Size | Indexed Items | Domain & Content Description |
| :--- | :--- | :---: | :---: | :--- |
| **Cases Vault** | `cases_vault_2026-W37.zip` | **132.8 MB** | **17,558** | **Judgment Headnotes & Metadata only** across Supreme Court, High Courts, and NCLT/NCLAT (full case bodies stripped for privacy). |
| **IBC Laws Vault** | `ibc_laws_vault_2026-W37.zip` | **90.0 MB** | **10,771** | Complete Insolvency & Bankruptcy Code 2016 + 9 IBBI Regulations (June 2026 compilation). Triggers: `@@ibc/...` |
| **Consolidated Laws** | `laws_vault_2026-W37.zip` | **33.6 MB** | **4,026** | Unified statutory text across IBC, MCA, Arbitration, SARFAESI, and RERA. |
| **Legal Documents Factory** | `documents_vault_2026-W37.zip` | **28.7 MB** | **3,510** | **The Master Template Vault:** All pleadings, corporate contracts, conveyancing deeds, and CA RK Gupta precedents combined. |
| **MCA / Companies Act** | `mca_laws_vault_2026-W37.zip` | **12.5 MB** | **1,574** | Companies Act 2013 + 48 MCA Rule Books + NCLT Rules with Monaco triggers `@@mca/...` |
| **RERA Laws** | `rera_laws_vault_2026-W37.zip` | **2.1 MB** | **222** | Real Estate (Regulation & Development) Act 2016 & State Rules. Triggers: `@@rera/...` |
| **Arbitration Laws** | `arbitration_laws_vault_2026-W37.zip` | **1.4 MB** | **160** | Arbitration & Conciliation Act 1996 (as amended up to 2026). Triggers: `@@arbitration/...` |
| **Debt Recovery Laws** | `debt_recovery_laws_vault_2026-W37.zip` | **0.6 MB** | **69** | SARFAESI Act 2002 & RDDBFI (DRT) Act 1993. Triggers: `@@debt_recovery/...` |
| **CUAD Contract Benchmark** | `cuad_benchmark_vault_2026-W37.zip` | **103.2 MB** | **13,829** | 510 commercial contracts classified across 41 legal risk categories (Atticus AI). |
| **ACORD Standard Clauses** | `acord_clauses_vault_2026-W37.zip` | **32.6 MB** | **4,200** | Standardized, attorney-reviewed contract clauses across corporate transactions. |

### 8.2 Specialized Process Suite Vaults

Standalone modular packages containing forms, AI drafting prompts, checklist trackers, and agent skills:
- **`cirp_suite_vault_2026-W36.zip`** (254 KB): CIRP Form A–H, claim verification memos, CoC minutes, avoidance opinions.
- **`liquidation_suite_vault_2026-W36.zip`** (1.45 MB): 63 phase-by-phase liquidation instruments, e-auction sale notices, Sec 53 waterfall.
- **`voluntary_liquidation_suite_vault_2026-W36.zip`** (1.53 MB): Declaration of solvency, stakeholder consultations, final dissolution drafts.
- **`ppirp_suite_vault_2026-W36.zip`** (284 KB): Pre-packaged insolvency Forms P1–P14, base resolution plan checklists.
- **`personal_guarantor_suite_vault_2026-W36.zip`** (178 KB): Sec 94 debtor / Sec 95 creditor applications, repayment plans, bankruptcy orders.

### 8.3 Disaster-Recovery Database Persistence (PostgreSQL)

In addition to compiled `.zip` archives, all **1,997 legal templates** across 35 categories are persisted inside `postgresql://localhost:5432/ibclaw_db` (table: `public.ibc_templates`) with SHA-256 integrity hashes:
- **Pleadings & Petitions**: 461 templates (`civil_pleadings`, `criminal_pleadings`, `petitions`, `notices`)
- **Corporate & Contracts**: 426 templates (`agreements`, `company_formats`, `bonds_and_guarantees`, `leases`)
- **Tax & Conveyancing**: 384 templates (`income_tax`, `real_estate_conveyancing`, `wills`, `trusts`)
- **IBC & Practice Precedents**: 307 templates (`ibc_precedents`, `ibc_forms`, `unprescribed_compendium`, `resolution_plans`, `real_estate_cirp`, `practice_notes`)
- **Other Practice Domains**: 419 templates (`arbitration`, `banking`, `intellectual_property`, `consumer_court`, `labor_laws`)

**Disaster-Recovery Command**: If disk files are ever deleted, restore all 1,997 templates in ~2 seconds:
```bash
python3 scripts/sync_templates_to_db.py --restore
```

---

*Haya Portal Admin Handbook v2.0 — Updated September 2026*

