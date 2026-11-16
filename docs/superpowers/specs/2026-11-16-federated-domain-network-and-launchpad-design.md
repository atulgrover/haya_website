# Design Spec: Federated Domain Network & Launchpad Architecture

- **Date**: 2026-11-16
- **Author**: Antigravity & User Team
- **Status**: Approved Design Specification
- **Target Platform**: `agenticprofessionals.net` & Federated Subdomains (`*.agenticprofessionals.net`)

---

## 1. Executive Summary & Vision

The **Agentic Professionals** ecosystem is evolving from a single monolithic skilling website into a **Federated Multi-Domain Network of Specialized Autonomous Practice Portals**. 

High-stakes practitioners—such as Insolvency Professionals, Criminal Advocates, Corporate Secretaries, and Tax Litigators—require sovereign, zero-noise statutory environments tailored to their specific legal acts, procedural timelines, and case law RAG pipelines.

Under this architecture:
1. **Master Network Portal (`agenticprofessionals.net`)**: Acts as the apex directory, marketing showcase, and multi-domain launchpad.
2. **Specialized Statutory Subdomains (`*.agenticprofessionals.net`)**: Sovereign standalone practice portals (e.g. `ibc.`, `bns.`, `gst.`, `mca.`, `sebi.`, `dgft.`).
3. **The Sovereign Engine Subdomain (`hayagriva.agenticprofessionals.net`)**: The dedicated Forge & Runtime portal where practitioners download the **Hayagriva Desktop Harness**, calibrate their agent's **`soul.md`** (Triguna Mandala), and forge their domain **`SKILL.md`** cartridges.

---

## 2. Core Architectural Pillars

### 2.1. Monorepo Organization on Disk (Polyrepo in Git)
To eliminate desktop clutter while preserving strict code modularity:
- On the user's filesystem, all services are housed under a single master directory: **`~/Desktop/agenticprofessionals/`**.
- Inside it, each domain is an isolated, independent folder with its own `package.json`, dependencies, and configurations:
  - `portal.agenticprofessionals/` (The apex website & vocational economic pillars)
  - `ibc.agenticprofessionals/` (Insolvency & Bankruptcy Code workspace)
  - `bns.agenticprofessionals/` (Bharatiya Nyaya Sanhita criminal law workspace)
  - `hayagriva.agenticprofessionals/` (Symlink pointing to `~/Desktop/Hayagriva/harness`)
- **Independent Git Repositories**: Each subdomain folder maintains its own Git origin (e.g. `github.com/atulgrover/haya_website.git`, `github.com/atulgrover/ibc_portal.git`). Pushing in `ibc.` deploys only IBC without touching the master portal.

### 2.2. Production Single Sign-On (SSO) Protocol
All subdomains share the common root domain **`agenticprofessionals.net`**.
Authentication utilizes HTTP cookies scoped to the root domain:
```http
Set-Cookie: auth_session=JWT_TOKEN_PAYLOAD; Domain=.agenticprofessionals.net; Path=/; Secure; HttpOnly; SameSite=Lax
```
Because the cookie domain is prefixed with a dot (`.agenticprofessionals.net`), standard RFC 6265 browser rules automatically pass the authenticated token to `ibc.agenticprofessionals.net`, `bns.agenticprofessionals.net`, and `hayagriva.agenticprofessionals.net`. A practitioner logs in once at the apex portal and hops between statutory practices with zero re-authentication.

### 2.3. The 3-Tier Domain Taxonomy
Domain subdomains are organized into three professional practice clusters plus the core engine:

| Cluster | Subdomain | Primary Practitioners | Core Focus Areas |
| :--- | :--- | :--- | :--- |
| **🏛️ Corporate & Finance** | `ibc.agenticprofessionals.net` | Resolution Professionals, NCLT Advocates | CIRP timelines, claim verification, Section 7/9/10, avoidance applications |
| | `mca.agenticprofessionals.net` | Company Secretaries, Corporate Lawyers | Companies Act 2013, ROC compliance, board resolutions, secretarial audit |
| | `sebi.agenticprofessionals.net` | Securities Lawyers, Compliance Officers | LODR regulations, insider trading, takeover code, SAT appeals |
| | `dgft.agenticprofessionals.net` | EXIM Consultants, Customs Brokers | Foreign trade policy, advance authorization, EPCG schemes |
| **📈 Taxation & Revenue** | `gst.agenticprofessionals.net` | GST Practitioners, Tax Advocates | ITC reconciliation, show-cause notice replies, GSTAT appellate filings |
| | `incometax.agenticprofessionals.net` | CAs, Direct Tax Litigators | Assessment scrutiny, Section 148 reopenings, ITAT appeals |
| **⚖️ Courts & Regulatory** | `bns.agenticprofessionals.net` | Criminal Defense & Prosecutors | Bharatiya Nyaya Sanhita, BNSS procedure, BSA evidence cross-referencing |
| | `cpc.agenticprofessionals.net` | Civil Litigators | Plaints, interim injunctions (Order 39), execution petitions |
| | `rera.agenticprofessionals.net` | Real Estate Lawyers, Promoters | Allottee complaints, developer compliance, RERA appellate tribunals |
| **⚡ Engine & Runtime** | `hayagriva.agenticprofessionals.net` | All Practitioners & Developers | Hayagriva Desktop Harness binary, local GGUF models, encrypted data vaults (`.vlt`) |

---

## 3. UI/UX Specification: The Master Launchpad (`index.html`)

The homepage of `agenticprofessionals.net` is restructured into the **Apex Network Directory**:

### 3.1. Hero Section
- **Title**: *"Command Specialized Autonomous Intelligence Across Indian Statutory & Corporate Domains."*
- **Subtitle**: *"From high-stakes NCLT corporate insolvency to criminal trials under the new Bharatiya Nyaya Sanhita. Access specialized agentic practice portals powered by sovereign offline AI."*
- **Triage Search Input**: High-contrast, sticky/prominent search field:
  - Placeholder: `🔍 Search by domain, statute, or act (e.g. "IBC", "GST appeals", "BNS", "Section 7", "ROC")...`
  - Real-time instant filtering isolates matching domain cards with 0 latency.
- **Cluster Filter Pills**:
  `[ All Domains ]` `[ 🏛️ Corporate & Finance ]` `[ 📈 Taxation ]` `[ ⚖️ Courts & Regulatory ]` `[ ⚡ Harness ]`

### 3.2. Responsive Domain Cards Grid
- **3-to-4 Column Adaptive Grid** displaying live practice cards:
  - **Subdomain URL Pill**: Monospace tag (e.g. `ibc.agenticprofessionals.net`) with live status beacon.
  - **Monogram Icon**: Recognizable visual emblem (⚖️, 🏛️, 📈, 📜, ⚡).
  - **Statutory Title**: Official name of the practice (e.g. *Insolvency & Bankruptcy Code*).
  - **Target Roles**: Primary practitioner personas (e.g. *Insolvency Professionals, CoC, NCLT Advocates*).
  - **Capability Tags**: 3 operational chips (e.g. `CIRP Timelines`, `Claim Verification`, `Avoidance Detector`).
  - **Direct Launch CTA Button**: `[ Launch IBC Portal ➔ ]`.

---

## 4. Routing Engine Specification (`getDomainUrl`)

To guarantee seamless execution in both local development (`localhost`) and live production:

```javascript
function getDomainUrl(subdomain) {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    const portMap = {
      portal: 3001,
      ibc: 3002,
      bns: 3003,
      hayagriva: 3000
    };
    const targetPort = portMap[subdomain] || 3001;
    return `http://localhost:${targetPort}`;
  }
  return `https://${subdomain}.agenticprofessionals.net`;
}
```

---

## 5. File & Directory Reorganization Plan

```
~/Desktop/agenticprofessionals/
├── portal.agenticprofessionals/     (Website, Express server, 4 economic pillars)
│   ├── index.html                   (Master Launchpad & Network Directory)
│   ├── employees_nsqf.html          (ai.playbooks)
│   ├── employers_sop.html           (ai.workflows)
│   ├── entrepreneurs_msme.html      (ai.ventures)
│   ├── personalities_vedic.html     (ai.personality)
│   ├── server/                      (Express backend connecting to hayadb)
│   ├── css/, js/, branding/
│   └── package.json
│
├── ibc.agenticprofessionals/        (Insolvency & Bankruptcy Code Subdomain)
│   ├── index.html / app code
│   └── package.json
│
├── bns.agenticprofessionals/        (Bharatiya Nyaya Sanhita Subdomain)
│   ├── index.html / app code
│   └── package.json
│
├── hayagriva.agenticprofessionals   ──► Symlink to ~/Desktop/Hayagriva/harness
│
└── start.sh / stop.sh               (Root multi-service orchestrator)
```

---

## 6. Verification & Acceptance Criteria

1. **Zero Path Breakage**: All 5 existing portal pages (`index.html`, `employees_nsqf.html`, etc.) continue returning HTTP 200 on port 3001.
2. **Domain Grid Search**: Typing keywords (e.g. `insolvency`, `bns`, `tax`) in the launchpad search bar filters domain cards instantly.
3. **Independent Git Repositories**: Each subdomain folder can execute `git status` and `git push` against its own remote without collision.
4. **Desktop Decluttering**: Outer legacy folders (`domains.agentic professionals`) retired cleanly with zero leftover artifacts.
