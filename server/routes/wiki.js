'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const WIKI_DIR = path.join(__dirname, '../../wiki');

// GET /api/wiki/professional-roles
// Returns specialized professional role titles with dedicated embedding, llm, vault, agent, gateway, and marketplace metadata
router.get('/professional-roles', (req, res) => {
    try {
        const roles = [
            {
                id: 'patent_builders',
                role_title: 'Patent Builders',
                category: 'Intellectual Property',
                description: 'Specialized environment for USPTO 35 U.S.C. 101/102/103 patent eligibility, claim drafting, antecedent linting, and Office Action responses.',
                embeddings: {
                    model_name: 'nomic-embed-text-v1.5',
                    dimensions: 768,
                    scope: 'USPTO MPEP Citations, Patent Claims & Prior Art Vectors',
                    details: 'Tuned specifically for patent claim semantic similarity and 35 U.S.C. 102 prior art novelty matching.'
                },
                llm: {
                    model_name: 'google/gemini-2.5-flash (OpenRouter)',
                    backup_model: 'anthropic/claude-3.7-sonnet',
                    local_gguf: 'Air-Gapped Local Port 8090 (GGUF 4-bit)',
                    details: 'Optimized for high-speed statutory claim parsing, statutory rejection responses, and Alice 101 eligibility auditing.'
                },
                vaults: {
                    vault_name: 'Patent Agent Vault (v1.0)',
                    file_name: 'patent_agents_v1.0.zip',
                    size: '10.42 KB',
                    details: 'Compiled offline encrypted vault asset containing 7 specialist agent personas, statutory linters, and Monaco slash rules.'
                },
                agents: [
                    { name: 'Invention Interrogator', file: 'interrogator.md', description: 'Extracts statutory claims and technical novelty features from raw disclosures.' },
                    { name: 'Alice 101 Examiner', file: 'alice_examiner.md', description: 'Audits claims under USPTO 2-step Alice framework for 35 U.S.C. 101 eligibility.' },
                    { name: 'Claim Drafter & Linter', file: 'claim_drafter.md', description: 'Drafts independent/dependent claims with automatic antecedent basis checking.' },
                    { name: 'Prior Art Analyst', file: 'prior_art_analyst.md', description: 'Evaluates novelty (102) and non-obviousness (103) against prior art citations.' },
                    { name: 'USPTO Mock Examiner', file: 'mock_examiner.md', description: 'Simulates strict USPTO Office Action rejections and allowance probability scores.' },
                    { name: 'Prosecution Counsel', file: 'prosecution_counsel.md', description: 'Drafts formal Office Action responses with USPTO track-changes markup.' },
                    { name: 'Figure Illustrator Agent', file: 'figure_illustrator.md', description: 'Generates structured ASCII and Mermaid patent drawing specifications.' }
                ],
                gateway: {
                    statutory_body: 'USPTO & Indian Patent Office (IPO)',
                    directives: 'MPEP Guidelines Section 706 & 2106 (Patent Subject Matter Eligibility)',
                    portals: ['USPTO Patent Center', 'IPO e-Filing Portal', 'Google Patents API'],
                    sovereignty: 'DPDP Act 2023 & IT Act 2000 Section 43A Local Data Sovereignty Certified'
                },
                marketplace: {
                    asset_title: 'Patent Agent Vault (v1.0)',
                    download_url: 'output/patent_agents_v1.0.zip',
                    file_name: 'patent_agents_v1.0.zip',
                    version: 'v1.0.0',
                    file_size: '10.42 KB',
                    released_at: '2026-08-08'
                }
            },
            {
                id: 'insolvency_professionals',
                role_title: 'Insolvency Professionals',
                category: 'Insolvency & Bankruptcy',
                description: 'Complete environment for Insolvency Professionals under the Insolvency & Bankruptcy Code 2016 (IBC), CIRP monitoring, and Form H compliance.',
                embeddings: {
                    model_name: 'bge-large-en-v1.5',
                    dimensions: 1024,
                    scope: 'IBC Code Sections, NCLT / NCLAT Precedents & Circulars',
                    details: 'Vectorized precedent repository covering NCLT judgments, CIRP timelines, and Section 30(2) compliance.'
                },
                llm: {
                    model_name: 'google/gemini-2.5-flash',
                    backup_model: 'Air-Gapped Local Port 8090 (GGUF 4-bit)',
                    local_gguf: 'Air-Gapped Local GGUF',
                    details: 'Audits CIRP timelines, claims ledgers, and CoC voting minutes.'
                },
                vaults: {
                    vault_name: 'IBC Resolution Vault (v2.0)',
                    file_name: 'ibc_precedent_vault_v2.vlt',
                    size: '48.50 MB',
                    details: 'Contains complete NCLT/NCLAT judgment databases and Resolution Plan compliance templates.'
                },
                agents: [
                    { name: 'IBC Statutory Auditor', file: 'ibc_auditor.md', description: 'Audits CIRP milestone timelines and Section 29A disqualifications.' },
                    { name: 'Form H Signer', file: 'form_h_signer.md', description: 'Generates cryptographically signed Form H compliance certificate.' },
                    { name: 'Claim Verifier', file: 'claim_verifier.md', description: 'Cross-verifies Operational and Financial Creditor proof of claim forms.' },
                    { name: 'CoC Minutes Analyzer', file: 'coc_analyzer.md', description: 'Parses Committee of Creditors voting results and resolution approvals.' }
                ],
                gateway: {
                    statutory_body: 'Insolvency & Bankruptcy Board of India (IBBI)',
                    directives: 'IBBI CIRP Regulations 2016 & Supreme Court Directives on AI in Judicial Audits',
                    portals: ['IBBI Portal', 'NCLT e-Courts Portal', 'Resolution Bazaar (rbz)'],
                    sovereignty: 'Ed25519 Cryptographic Signatures & Tamper-Evident Audit Trails'
                },
                marketplace: {
                    asset_title: 'IBC Resolution Vault (v2.0)',
                    download_url: 'downloads/ibc_precedent_vault_v2.zip',
                    file_name: 'ibc_precedent_vault_v2.zip',
                    version: 'v2.1.0',
                    file_size: '48.50 MB',
                    released_at: '2026-08-05'
                }
            },
            {
                id: 'corporate_advocates',
                role_title: 'Corporate Advocates',
                category: 'Corporate & Litigation',
                description: 'Litigation environment for corporate advocates, high court practitioners, and trial attorneys.',
                embeddings: {
                    model_name: 'bge-small-en-v1.5',
                    dimensions: 384,
                    scope: 'CPC, CrPC, Evidence Act & High Court Case Laws',
                    details: 'Optimized for rapid case law search, procedural objection checking, and brief drafting.'
                },
                llm: {
                    model_name: 'anthropic/claude-3.7-sonnet',
                    backup_model: 'google/gemini-2.5-flash',
                    local_gguf: 'Air-Gapped Local GGUF',
                    details: 'Synthesizes persuasive legal arguments, pleading drafts, and cross-examination strategies.'
                },
                vaults: {
                    vault_name: 'Commercial Litigation Vault (v1.5)',
                    file_name: 'litigation_vault_v1.vlt',
                    size: '32.10 MB',
                    details: 'Precedent brief repository for High Court commercial suits and writ petitions.'
                },
                agents: [
                    { name: 'Mock Judge Litigation Agent', file: 'mock_judge.md', description: 'Simulates hostile bench questioning and identifies weaknesses in legal briefs.' },
                    { name: 'Pleading Drafter', file: 'pleading_drafter.md', description: 'Drafts plaints, written statements, and interlocutory applications.' },
                    { name: 'Evidence Linter', file: 'evidence_linter.md', description: 'Verifies admissibility of electronic evidence under Section 65B.' }
                ],
                gateway: {
                    statutory_body: 'Bar Council of India & Supreme Court of India',
                    directives: 'High Court Commercial Division Rules & e-Courts Directives',
                    portals: ['e-Courts India Portal', 'Supreme Court e-Filing', 'High Court Registry'],
                    sovereignty: 'Strict Attorney-Client Privilege Local Hardware Boundaries'
                },
                marketplace: {
                    asset_title: 'Commercial Litigation Vault (v1.5)',
                    download_url: 'downloads/litigation_vault.zip',
                    file_name: 'litigation_vault.zip',
                    version: 'v1.5.0',
                    file_size: '32.10 MB',
                    released_at: '2026-08-01'
                }
            },
            {
                id: 'contract_arbitrators',
                role_title: 'Contract Arbitrators',
                category: 'Arbitration & Contracts',
                description: 'Specialized suite for contract clause auditing, antecedent term checking, and commercial arbitration.',
                embeddings: {
                    model_name: 'nomic-embed-text-v1.5',
                    dimensions: 768,
                    scope: 'Commercial Contracts, Arbitration Awards & NDAs',
                    details: 'Vectorized contract clause repository for indemnification, liability, and dispute resolution clauses.'
                },
                llm: {
                    model_name: 'google/gemini-2.5-flash',
                    backup_model: 'claude-3.7-sonnet',
                    local_gguf: 'Air-Gapped Local GGUF',
                    details: 'Lints contract terminology for antecedent consistency and breach risk scores.'
                },
                vaults: {
                    vault_name: 'Contract Compliance Vault (v1.0)',
                    file_name: 'contract_vault_v1.vlt',
                    size: '15.80 MB',
                    details: 'Contains 500+ standardized commercial contract templates and clause risk benchmarks.'
                },
                agents: [
                    { name: 'Contract Antecedent Linter', file: 'contract_antecedent_linter.js', description: 'Scans contract text for undefined capitalized terms and ambiguous clauses.' },
                    { name: 'Arbitration Clause Checker', file: 'arbitration_checker.md', description: 'Verifies seat/venue clarity and institutional arbitration rules.' },
                    { name: 'Breach Risk Analyst', file: 'breach_analyst.md', description: 'Calculates monetary exposure and liquidated damages enforceability.' }
                ],
                gateway: {
                    statutory_body: 'Arbitration & Conciliation Act 1996 (as amended)',
                    directives: 'Indian Contract Act 1872 & International Arbitration Guidelines',
                    portals: ['MCIA Portal', 'DIAC Registry', 'UNCITRAL Arbitration Standards'],
                    sovereignty: 'Encrypted Contract Vaults with On-Premise Execution'
                },
                marketplace: {
                    asset_title: 'Contract Compliance Vault (v1.0)',
                    download_url: 'downloads/contract_vault.zip',
                    file_name: 'contract_vault.zip',
                    version: 'v1.0.0',
                    file_size: '15.80 MB',
                    released_at: '2026-07-28'
                }
            }
        ];

        res.json({ success: true, count: roles.length, roles });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/wiki/list - Dynamically scan wiki/ directory
router.get('/list', (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        if (!fs.existsSync(WIKI_DIR)) {
            fs.mkdirSync(WIKI_DIR, { recursive: true });
        }

        const files = fs.readdirSync(WIKI_DIR);
        const htmlFiles = files.filter(f => f.endsWith('.html') || f.endsWith('.htm'));

        const wikis = htmlFiles.map(filename => {
            const filePath = path.join(WIKI_DIR, filename);
            const stats = fs.statSync(filePath);
            const lowerName = filename.toLowerCase();

            let title = filename.replace(/\.(html|htm)$/i, '').replace(/[-_]/g, ' ');
            title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            let subtitle = 'Interactive Knowledge Base';

            try {
                const buffer = Buffer.alloc(4096);
                const fd = fs.openSync(filePath, 'r');
                const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
                fs.closeSync(fd);
                const snippet = buffer.toString('utf8', 0, bytesRead);
                
                const titleMatch = snippet.match(/<title>([^<]+)<\/title>/i);
                if (titleMatch && titleMatch[1].trim()) {
                    let parsedTitle = titleMatch[1].trim();
                    parsedTitle = parsedTitle.replace(/\s*[—|-]\s*TiddlyWiki.*$/i, '');
                    if (parsedTitle) title = parsedTitle;
                }

                const descMatch = snippet.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
                if (descMatch && descMatch[1].trim()) {
                    subtitle = descMatch[1].trim();
                }
            } catch (e) {}

            let icon = '📄';
            if (lowerName.includes('ipie') || lowerName.includes('gateway')) icon = '⚡';
            else if (lowerName.includes('agent') || lowerName.includes('workflow')) icon = '🤖';
            else if (lowerName.includes('vault') || lowerName.includes('law')) icon = '📚';
            else if (lowerName.includes('report') || lowerName.includes('audit')) icon = '📊';

            return {
                filename,
                path: `wiki/${filename}`,
                title,
                subtitle,
                icon,
                mtime: stats.mtime
            };
        });

        wikis.sort((a, b) => {
            if (a.filename === 'ipie.html') return -1;
            if (b.filename === 'ipie.html') return 1;
            return a.title.localeCompare(b.title);
        });

        res.json({ success: true, count: wikis.length, wikis });
    } catch (e) {
        res.status(500).json({ error: 'Failed to scan wiki directory: ' + e.message });
    }
});

module.exports = router;
