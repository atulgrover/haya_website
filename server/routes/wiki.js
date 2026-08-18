'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const WIKI_DIR = path.join(__dirname, '../../wiki');

// GET /api/wiki/professional-roles
// Returns specialized professional role titles with exact verified HAYAGRIVA assets and Monaco slash commands (/commands)
router.get('/professional-roles', (req, res) => {
    try {
        const roles = [
            {
                id: 'patent_builders',
                role_title: 'Patent Builders',
                category: 'Intellectual Property',
                description: 'Specialized environment for USPTO 35 U.S.C. 101/102/103 patent eligibility, claim drafting, antecedent linting, and Office Action responses.',
                embeddings: {
                    model_name: 'InLegal-SBERT',
                    dimensions: 384,
                    scope: 'USPTO MPEP Citations, Patent Claims & Prior Art Vectors (100% Local ONNX)',
                    details: '100% Local ONNX embedding model fine-tuned for patent claim semantic similarity and 35 U.S.C. 102 prior art novelty matching.'
                },
                llm: {
                    model_name: 'LegalParam-2.9B (Local GGUF)',
                    backup_model: 'google/gemini-2.5-flash',
                    local_gguf: 'Air-Gapped Local Port 8090 (GGUF 4-bit)',
                    details: 'Bundled starter LLM optimized for high-speed statutory claim parsing, rejection responses, and Alice 101 eligibility auditing.'
                },
                vaults: {
                    vault_name: 'Legal Templates Vault (documents_vault)',
                    file_name: 'patent_agents_v1.0.zip',
                    size: '28.7 MB (Data Vault) + 10.42 KB (Agent Pack)',
                    details: 'Encrypted local data vault containing patent disclosures, claims templates, and 7 specialist patent agent personas.'
                },
                agents: [
                    { name: 'Advisor Agent (@advisor)', file: '@advisor', description: 'Legal research specialist querying local statutory laws and MPEP guidelines.' },
                    { name: 'Document Agent (@document)', file: '@document', description: 'Drafts patent specifications and independent/dependent claim trees.' },
                    { name: 'Forms Agent (@forms)', file: '@forms', description: 'Audits USPTO filing forms and checks antecedent basis consistency.' },
                    { name: 'Invention Interrogator', file: 'interrogator.md', description: 'Extracts statutory claims and technical novelty features from raw disclosures.' },
                    { name: 'Alice 101 Examiner', file: 'alice_examiner.md', description: 'Audits claims under USPTO 2-step Alice framework for 35 U.S.C. 101 eligibility.' },
                    { name: 'Claim Drafter & Linter', file: 'claim_drafter.md', description: 'Drafts claims with automatic antecedent basis checking.' },
                    { name: 'USPTO Mock Examiner', file: 'mock_examiner.md', description: 'Simulates strict USPTO Office Action rejections and allowance probability scores.' }
                ],
                slash_commands: [
                    { command: '/law <statute>', description: 'Searches USPTO MPEP guidelines & 35 U.S.C. sections.', example: '/law 35 usc 101' },
                    { command: '/precedent <query>', description: 'Queries USPTO Patent Trial and Appeal Board (PTAB) precedent rulings.', example: '/precedent alice 101 eligibility' },
                    { command: '/interrogate', description: 'Triggers Invention Interrogator to extract statutory claim elements.', example: '/interrogate raw_disclosure.md' },
                    { command: '/alice', description: 'Audits claims under 2-step USPTO Alice Framework for eligibility.', example: '/alice claim 1' },
                    { command: '/draft-claim', description: 'Generates independent/dependent claims with antecedent linter.', example: '/draft-claim method' },
                    { command: '/mock-examiner', description: 'Simulates USPTO Office Action rejections and allowance score.', example: '/mock-examiner' },
                    { command: '/export-sc', description: '1-Click USPTO / Court DOCX formatting compiler.', example: '/export-sc' }
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
                    model_name: 'InLegal-SBERT & Finance-Embeddings (Dual RAG)',
                    dimensions: 384,
                    scope: 'IBC Code Sections, NCLT / NCLAT Judgments & Bank Ledgers (100% Local ONNX)',
                    details: 'Dual query RAG pipeline routing legal documents to InLegal-SBERT and financial ledgers to Finance-Embeddings.'
                },
                llm: {
                    model_name: 'FinanceParam-2.9B & LegalParam-2.9B',
                    backup_model: 'google/gemini-2.5-flash',
                    local_gguf: 'Air-Gapped Local Port 8090 (GGUF 4-bit)',
                    details: 'Dual-domain GGUF models for auditing CIRP timelines, bank ledgers, claim forms, and CoC voting minutes.'
                },
                vaults: {
                    vault_name: 'Laws Vault (33.6 MB) + Cases Vault (132.8 MB)',
                    file_name: 'ibc_precedent_vault_v2.vlt',
                    size: '166.4 MB Combined Vaults',
                    details: 'Complete IBC 2016 statutory code, IBBI CIRP regulations, and Supreme Court / NCLAT landmark precedent indices.'
                },
                agents: [
                    { name: 'Avoidance Audit Agent (@avoidance)', file: '@avoidance', description: 'Scans ledgers for suspect transactions under Sections 43, 45, 50, and 66 of IBC.' },
                    { name: 'Claims Verification Agent (@claims)', file: '@claims', description: 'Audits admitted vs rejected balances for Form B, Form C, and Form D claim forms.' },
                    { name: 'IM Compiler Agent (@im_compiler)', file: '@im_compiler', description: 'Aggregates balance sheets and litigation registries into Regulation 36 Information Memorandum.' },
                    { name: 'Forms Agent (@forms)', file: '@forms', description: 'Audits MCA forms, AOC-4, MGT-7, and Form H resolution compliance.' },
                    { name: 'Forensic Audit Agent (@forensic)', file: '@forensic', description: 'Deep financial forensic statement and bank cashbook auditor.' }
                ],
                slash_commands: [
                    { command: '/law <statute>', description: 'Searches IBC Code 2016 sections, IBBI circulars & MCA rules.', example: '/law ibc 14' },
                    { command: '/precedent <query>', description: 'Searches Supreme Court & NCLAT landmark precedents.', example: '/precedent related party voting' },
                    { command: '/avoidance', description: 'Runs Avoidance Transaction Audit for Sections 43, 45, 50, and 66.', example: '/avoidance lookback 2yr' },
                    { command: '/claims', description: 'Audits admitted vs rejected balances for Form B, C, and D.', example: '/claims audit' },
                    { command: '/im_compiler', description: 'Compiles Regulation 36 Information Memorandum.', example: '/im_compiler' },
                    { command: '/forms', description: 'Audits Form H compliance and CoC voting percentages.', example: '/forms form_h' },
                    { command: '/export-sc', description: '1-Click NCLT / NCLAT DOCX formatting compiler.', example: '/export-sc' }
                ],
                gateway: {
                    statutory_body: 'Insolvency & Bankruptcy Board of India (IBBI)',
                    directives: 'IBBI CIRP Regulations 2016 & Supreme Court Directives on AI in Judicial Audits',
                    portals: ['IBBI Portal', 'NCLT e-Courts Portal', 'Resolution Bazaar (rbz)'],
                    sovereignty: 'Ed25519 Cryptographic Signatures & Tamper-Evident Audit Trails'
                },
                marketplace: {
                    asset_title: 'IBC Precedent & Laws Vault (v2.0)',
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
                    model_name: 'InLegal-SBERT',
                    dimensions: 384,
                    scope: 'CPC, CrPC, Evidence Act & High Court Case Laws (100% Local ONNX)',
                    details: 'Tuned specifically for fast case law search, procedural objection checking, and pleading drafting.'
                },
                llm: {
                    model_name: 'SaulLM-7B Instruct (PRO 4.37 GB)',
                    backup_model: 'anthropic/claude-3.7-sonnet',
                    local_gguf: 'Air-Gapped Local Port 8090 (GGUF 4-bit)',
                    details: 'Specialized 7B Legal LLM pre-trained on 30B+ legal tokens for litigation argument synthesis and pleading drafts.'
                },
                vaults: {
                    vault_name: 'Judgments & Case Law Vault (cases_vault)',
                    file_name: 'litigation_vault_v1.vlt',
                    size: '132.8 MB (Cases) + 28.7 MB (Documents)',
                    details: 'Supreme Court & High Court precedent brief repository for commercial suits and writ petitions.'
                },
                agents: [
                    { name: 'Advisor Agent (@advisor)', file: '@advisor', description: 'Legal research specialist querying landmark Supreme Court precedent indices.' },
                    { name: 'Document Agent (@document)', file: '@document', description: 'Compiles legal plaints, written statements, and interlocutory applications.' },
                    { name: 'Judicial Agent (@nclt)', file: '@nclt', description: 'Simulates bench questioning and procedural compliance checks.' },
                    { name: 'Mock Judge Red-Teaming', file: 'mock_judge.md', description: 'Simulates hostile bench questioning and identifies weaknesses in legal briefs.' }
                ],
                slash_commands: [
                    { command: '/law <statute>', description: 'Searches CPC, CrPC, Companies Act, and High Court Rules.', example: '/law cpc order 39' },
                    { command: '/precedent <query>', description: 'Searches High Court & Supreme Court ruling vectors.', example: '/precedent specific performance' },
                    { command: '/advisor', description: 'Triggers Advisor Agent for deep statutory & precedent Q&A.', example: '/advisor notice period' },
                    { command: '/mock-judge', description: 'Simulates hostile judicial questioning on active brief.', example: '/mock-judge redteam' },
                    { command: '/pleading', description: 'Drafts plaints, written statements, and petitions.', example: '/pleading plaint' },
                    { command: '/evidence', description: 'Lints electronic evidence for Section 65B compliance.', example: '/evidence cert65b' },
                    { command: '/export-sc', description: '1-Click Supreme Court A4 DOCX compiler.', example: '/export-sc' }
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
                    model_name: 'InLegal-SBERT',
                    dimensions: 384,
                    scope: 'Commercial Contracts, Arbitration Awards & NDAs (100% Local ONNX)',
                    details: 'Vectorized contract clause repository for indemnification, liability, and dispute resolution clauses.'
                },
                llm: {
                    model_name: 'LegalParam-2.9B (Local GGUF)',
                    backup_model: 'google/gemini-2.5-flash',
                    local_gguf: 'Air-Gapped Local Port 8090 (GGUF 4-bit)',
                    details: 'Lints contract terminology for antecedent consistency and breach risk scores.'
                },
                vaults: {
                    vault_name: 'Laws Vault (33.6 MB) + Documents Vault (28.7 MB)',
                    file_name: 'contract_vault_v1.vlt',
                    size: '62.3 MB Combined Vaults',
                    details: 'Contains Arbitration & Conciliation Act 1996, Indian Contract Act 1872, and 500+ commercial contract templates.'
                },
                agents: [
                    { name: 'Document Agent (@document)', file: '@document', description: 'Compiles arbitration petitions, statement of claims, and award certificates.' },
                    { name: 'Forms Agent (@forms)', file: '@forms', description: 'Audits contract mathematical obligations and penalty clause timelines.' },
                    { name: 'Contract Antecedent Linter', file: 'contract_antecedent_linter.js', description: 'Scans contract text for undefined capitalized terms and ambiguous clauses.' }
                ],
                slash_commands: [
                    { command: '/law <statute>', description: 'Searches Arbitration & Conciliation Act 1996 and Contract Act 1872.', example: '/law arb sec 11' },
                    { command: '/clause <type>', description: 'Inserts standard boilerplate (arbitration, indemnity, governing law).', example: '/clause arbitration' },
                    { command: '/antecedent', description: 'Scans contract text for undefined capitalized terms.', example: '/antecedent lint' },
                    { command: '/arbitration', description: 'Verifies seat/venue clarity and institutional rules.', example: '/arbitration seat' },
                    { command: '/breach', description: 'Calculates monetary exposure & liquidated damages enforcement.', example: '/breach risk' },
                    { command: '/export-sc', description: '1-Click Arbitral Award DOCX compiler.', example: '/export-sc' }
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

// GET /api/wiki/reel/:qpCode - Download/View Single-File Offline Reel Wiki
router.get('/reel/:qpCode', (req, res) => {
    try {
        const rawQp = req.params.qpCode;
        const cleanQp = rawQp.replace(/\//g, '_');
        const wikiPath = path.join(__dirname, '../../data/wiki', `${cleanQp}_ReelWiki.html`);

        if (fs.existsSync(wikiPath)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `inline; filename="${cleanQp}_ReelWiki.html"`);
            return res.sendFile(wikiPath);
        }

        // If not pre-compiled, trigger live synthesis or return 404
        return res.status(404).json({
            error: `Offline Reel Wiki for ${rawQp} not yet compiled. Run: node scripts/nsqf_wiki_exporter.js --qp=${rawQp}`
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to retrieve reel wiki: ' + e.message });
    }
});

// GET /api/wiki/reel/:qpCode/qr - Generate Scan-to-Download URL & QR metadata
router.get('/reel/:qpCode/qr', (req, res) => {
    try {
        const rawQp = req.params.qpCode;
        const cleanQp = rawQp.replace(/\//g, '_');
        const host = req.get('host') || 'localhost:3000';
        const protocol = req.protocol || 'http';
        const downloadUrl = `${protocol}://${host}/api/wiki/reel/${cleanQp}`;

        res.json({
            success: true,
            qp_code: rawQp,
            clean_qp: cleanQp,
            download_url: downloadUrl,
            tiddloid_import_url: downloadUrl,
            instructions: 'Scan this QR code with your mobile browser or Tiddloid Lite to download the 100% offline trade wiki.'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/wiki/pc/update - Update PC video, timestamps, and pro-tips live in PostgreSQL
router.post('/pc/update', async (req, res) => {
    try {
        const db = require('../db');
        let { qpCode, pcId, videoId, videoTitle, startSeconds, endSeconds, studyTakeaways, vivaQuiz } = req.body;
        if (!qpCode || !pcId || !videoId) {
            return res.status(400).json({ error: 'qpCode, pcId, and videoId are required.' });
        }

        const ytMatch = String(videoId).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
            videoId = ytMatch[1];
        } else {
            videoId = String(videoId).trim();
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const startSec = (startSeconds !== undefined && startSeconds !== null && startSeconds !== '') ? parseInt(startSeconds, 10) : 0;
        const endSec   = (endSeconds !== undefined && endSeconds !== null && endSeconds !== '') ? parseInt(endSeconds, 10) : null;
        
        const takeawaysJson = studyTakeaways ? (typeof studyTakeaways === 'object' ? JSON.stringify(studyTakeaways) : studyTakeaways) : null;
        const vivaQuizJson  = vivaQuiz ? (typeof vivaQuiz === 'object' ? JSON.stringify(vivaQuiz) : vivaQuiz) : null;

        await db.prepare(`
            UPDATE nsqf_pcs 
            SET video_id = ?, 
                video_title = ?, 
                video_url = ?,
                start_seconds = ?,
                end_seconds = ?,
                study_takeaways_json = COALESCE(?, study_takeaways_json),
                viva_quiz_json = COALESCE(?, viva_quiz_json)
            WHERE (qp_code = ? OR REPLACE(qp_code, '/', '_') = ?) AND pc_code = ?
        `).run(videoId, videoTitle || 'NSQF Demonstration', videoUrl, startSec, endSec, takeawaysJson, vivaQuizJson, qpCode, qpCode.replace('/', '_'), pcId);

        res.json({ 
            success: true, 
            message: `Updated video and timestamps for ${qpCode} ${pcId}`,
            updated: {
                qp_code: qpCode,
                pc_code: pcId,
                video_id: videoId,
                video_url: videoUrl,
                start_seconds: startSec,
                end_seconds: endSec
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
