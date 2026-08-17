'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  HAYAGRIVA GENUINE TIDDLYWIKI 5 COMPILER & EXPORTER (v2)               ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Compiles the 3-JSON Master Lake (NSQF + SOP + MSME) into a 100% genuine ║
 * ║  TiddlyWiki 5 HTML file compatible with Tiddloid Lite, Quine & Safari.   ║
 * ║                                                                          ║
 * ║  Features:                                                               ║
 * ║    1. 📱 MobileTikTokCSS ($:/tags/Stylesheet) for full-screen snap feed   ║
 * ║    2. 🎬 TikTokVideoTemplate ($:/tags/ViewTemplate) with bounded player   ║
 * ║    3. 🔄 $:/ui/TikTokModeSwitcher for 1-click Reel / Classic Wiki mode  ║
 * ║    4. 🧠 Interactive 3-Q Bilingual Viva Exam tiddlers                     ║
 * ║    5. 🏭 10-Chapter SOP Workstation & 🚀 MSME Machinery BOM tiddlers     ║
 * ║    6. 💾 Full Tiddloid Lite native silent auto-saving & tagging graph    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node scripts/nsqf_wiki_exporter.js --sample
 *   node scripts/nsqf_wiki_exporter.js --qp=SGJ/Q0101
 *   node scripts/nsqf_wiki_exporter.js --all
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../server/db');

const NSQF_JSON_DIR = path.join(__dirname, '..', 'data', 'json', 'nsqf');
const SOP_JSON_DIR  = path.join(__dirname, '..', 'data', 'json', 'sop');
const MSME_JSON_DIR = path.join(__dirname, '..', 'data', 'json', 'msme');
const WIKI_OUT_DIR  = path.join(__dirname, '..', 'data', 'wiki');
const BASE_WIKI_SRC = path.join(__dirname, '..', 'wiki', 'ipie.html');

if (!fs.existsSync(WIKI_OUT_DIR)) {
    fs.mkdirSync(WIKI_OUT_DIR, { recursive: true });
}

// ── 1. Read Base TiddlyWiki5 HTML Wrapper & Core Plugins ─────────────────────
function loadBaseTiddlyWikiTemplate() {
    if (!fs.existsSync(BASE_WIKI_SRC)) {
        throw new Error(`Base TiddlyWiki template not found at: ${BASE_WIKI_SRC}`);
    }

    const rawHtml = fs.readFileSync(BASE_WIKI_SRC, 'utf8');
    const startTag = '<script class="tiddlywiki-tiddler-store" type="application/json">';
    const endTag   = '</script><div id="storeArea"';

    const startIndex = rawHtml.indexOf(startTag);
    const endIndex   = rawHtml.indexOf(endTag, startIndex);

    if (startIndex === -1 || endIndex === -1) {
        throw new Error('Unable to locate tiddlywiki-tiddler-store markers in base template.');
    }

    const preStoreHtml  = rawHtml.substring(0, startIndex + startTag.length);
    const postStoreHtml = rawHtml.substring(endIndex);
    const storeRaw      = rawHtml.substring(startIndex + startTag.length, endIndex);
    const baseTiddlers  = JSON.parse(storeRaw);

    // Keep essential system plugins ($:/core, themes, menubar)
    const essentialTiddlers = baseTiddlers.filter(t => 
        t.title === '$:/core' ||
        t.title.startsWith('$:/themes/') ||
        t.title.startsWith('$:/plugins/tiddlywiki/')
    );

    return { preStoreHtml, postStoreHtml, essentialTiddlers };
}

// ── 2. Build TiddlyWiki Tiddlers for a Qualification Pack ────────────────────
async function buildQpTiddlers(qpCode, qpName, sector, nsqfLevel, nsqfData, sopData, msmeData) {
    const tiddlers = [];
    const cleanQp = qpCode.replace(/\//g, '_');
    const safeQpName = (qpName || qpCode).replace(/[\\"']/g, '');

    // ── A. Site Meta & State ──
    tiddlers.push({
        title: '$:/SiteTitle',
        text: `HAYAGRIVA: ${safeQpName}`
    });
    tiddlers.push({
        title: '$:/SiteSubtitle',
        text: `NCVET NSQF Level ${nsqfLevel} • 100% Offline Trade Field Wiki`
    });
    tiddlers.push({
        title: '$:/state/TikTokViewMode',
        text: 'yes' // Default to TikTok view on mobile
    });

    // ── B. MobileTikTokCSS ($:/tags/Stylesheet) ──
    const mobileTikTokCssText = `
/* HAYAGRIVA Mobile TikTok Reel & Clean Layout Stylesheet */
<$list filter="[{$:/state/TikTokViewMode}match[yes]] [!has[$:/state/TikTokViewMode]]">
html, body {
    overflow: hidden !important;
    height: 100vh !important;
    background: #000000 !important;
    font-family: system-ui, -apple-system, sans-serif !important;
}
.tc-story-river {
    padding: 0 !important;
    margin: 0 !important;
    height: 100vh !important;
    overflow-y: scroll !important;
    scroll-snap-type: y mandatory !important;
    -webkit-overflow-scrolling: touch;
}
.tc-sidebar-scrollable, .tc-topbar, .tc-tiddler-title, .tc-subtitle, .tc-tags-wrapper {
    display: none !important;
}
.tc-tiddler-frame {
    margin: 0 !important;
    padding: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    scroll-snap-align: start !important;
    scroll-snap-stop: always !important;
    position: relative !important;
    border: none !important;
    background: #000000 !important;
}
.tiktok-wrapper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
.tiktok-wrapper iframe {
    width: 100%;
    height: 100%;
    border: none;
}
.tiktok-overlay-actions {
    position: absolute;
    right: 14px;
    bottom: 120px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    z-index: 50;
}
.tiktok-btn {
    background: rgba(15, 23, 42, 0.8) !important;
    border: 1px solid rgba(255, 255, 255, 0.25) !important;
    backdrop-filter: blur(8px) !important;
    width: 48px !important;
    height: 48px !important;
    border-radius: 50% !important;
    color: #FFFFFF !important;
    font-size: 18px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
}
.tiktok-btn span {
    font-size: 8.5px !important;
    font-weight: 700 !important;
    margin-top: 1px !important;
    color: #94A3B8 !important;
}
.tiktok-bottom-caption {
    position: absolute;
    left: 0;
    right: 70px;
    bottom: 0;
    padding: 24px 16px 32px 16px;
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%);
    z-index: 40;
    color: #FFFFFF;
    pointer-events: none;
}
</$list>

/* Floating Mode Switcher Pill */
.tiktok-mode-pill {
    position: fixed;
    top: 14px;
    left: 14px;
    z-index: 100;
    background: rgba(15, 23, 42, 0.9) !important;
    border: 1px solid #38BDF8 !important;
    backdrop-filter: blur(8px) !important;
    color: #38BDF8 !important;
    padding: 6px 14px !important;
    border-radius: 20px !important;
    font-size: 11.5px !important;
    font-weight: 800 !important;
    cursor: pointer !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;
}
`;
    tiddlers.push({
        title: 'MobileTikTokCSS',
        tags: '$:/tags/Stylesheet',
        text: mobileTikTokCssText
    });

    // ── C. TikTokVideoTemplate ($:/tags/ViewTemplate) ──
    const viewTemplateText = `
<% if [is[current]tag[TikTok]] %>
<div class="tiktok-wrapper">
  <!-- Bounded Micro-Reel Player -->
  <iframe src={{{ [[https://www.youtube.com/embed/]addsuffix{!!youtube_id}addsuffix[?start=]addsuffix{!!start_seconds}addsuffix[&end=]addsuffix{!!end_seconds}addsuffix[&autoplay=1&mute=1&loop=1&playlist=]addsuffix{!!youtube_id}addsuffix[&controls=0&modestbranding=1&rel=0&enablejsapi=1]] }}} allow="autoplay; encrypted-media" allowfullscreen></iframe>

  <!-- Right Floating Action Buttons -->
  <div class="tiktok-overlay-actions">
    <!-- Save/Bookmark -->
    <$button class="tiktok-btn" tooltip="Bookmark Criterion">
      <$action-listops $tags="+[toggle[Bookmarked]]"/>
      <$list filter="[is[current]tag[Bookmarked]]" emptyMessage="🤍">❤️</$list>
      <span>Save</span>
    </$button>

    <!-- Viva Exam Modal Trigger -->
    <$button class="tiktok-btn" tooltip="Take 3-Q Viva Quiz" set="$:/state/ActiveViva" setTo=<<currentTiddler>>>
      🧠
      <span>Viva</span>
    </$button>

    <!-- Switch to Detailed Standard Notes -->
    <$button class="tiktok-btn" tooltip="Open Full Study Notes & SOP" set="$:/state/TikTokViewMode" setTo="no">
      📖
      <span>Notes</span>
    </$button>
  </div>

  <!-- Bottom Overlay Caption -->
  <div class="tiktok-bottom-caption">
    <div style="font-size:11px; font-weight:800; color:#38BDF8; letter-spacing:0.5px;">
      {{!!pc_code}} • {{!!nos_code}}
    </div>
    <div style="font-size:14.5px; font-weight:700; margin:2px 0 4px 0; line-height:1.3; text-shadow:0 1px 3px rgba(0,0,0,0.8);">
      <$view field="title"/>
    </div>
    <div style="font-size:12px; color:#E2E8F0; line-height:1.4; text-shadow:0 1px 2px rgba(0,0,0,0.8);">
      💡 {{!!pro_tip}}
    </div>
  </div>
</div>
<% endif %>
`;
    tiddlers.push({
        title: 'TikTokVideoTemplate',
        tags: '$:/tags/ViewTemplate',
        'list-before': '$:/core/ui/ViewTemplate/body',
        text: viewTemplateText
    });

    // ── D. Floating Mode Switcher ($:/tags/PageTemplate) ──
    const modeSwitcherText = `
<$list filter="[{$:/state/TikTokViewMode}match[no]]">
  <$button class="tiktok-mode-pill" set="$:/state/TikTokViewMode" setTo="yes">
    🎬 Switch to TikTok Reel Mode
  </$button>
</$list>

<$list filter="[{$:/state/TikTokViewMode}match[yes]] [!has[$:/state/TikTokViewMode]]">
  <$button class="tiktok-mode-pill" set="$:/state/TikTokViewMode" setTo="no">
    📚 Switch to Classic Notebook Mode
  </$button>
</$list>
`;
    tiddlers.push({
        title: '$:/ui/TikTokModeSwitcher',
        tags: '$:/tags/PageTemplate',
        text: modeSwitcherText
    });

    // ── E. Trade Overview Tiddler ──
    tiddlers.push({
        title: `Overview: ${safeQpName}`,
        tags: 'Overview Navigation',
        text: `! ${safeQpName} (${qpCode})

* **Sector:** ${sector}
* **NSQF Level:** Level ${nsqfLevel}
* **Offline Field Wiki:** 100% self-contained in Tiddloid Lite / Browser

---
!! 🚀 Fast Navigation
* [[🎬 Open Full-Screen TikTok Reel Feed|$:/state/TikTokViewMode]] (Set to "yes")
* {{||$:/core/ui/TagList}}
`
    });

    // ── F. Generate Performance Criteria Tiddlers (Tagged: TikTok) ──
    const defaultStory = [];
    let pcList = [];

    // 1. Fetch from PostgreSQL
    try {
        const dbRes = await db.query(`
            SELECT pc_code, pc_description, pc_intent, pc_intent_hi, nos_code, video_id, video_id_hi,
                   start_seconds, end_seconds, study_takeaways_json, viva_quiz_json
            FROM nsqf_pcs
            WHERE qp_code = $1 OR qp_code ILIKE $2
            ORDER BY sequence_order ASC, id ASC
        `, [qpCode, `%${cleanQp.replace(/_/g, '%')}%`]);
        if (dbRes.rows && dbRes.rows.length > 0) {
            pcList = dbRes.rows;
        }
    } catch (e) {
        console.warn('DB PC Query failed:', e.message);
    }

    // 2. Fallback to JSON Lake if DB returned empty
    if (pcList.length === 0 && nsqfData && Array.isArray(nsqfData.nos_units)) {
        nsqfData.nos_units.forEach(nos => {
            const nosCode = nos.nos_code || nos.code || 'NOS';
            (nos.modules || []).forEach(mod => {
                (mod.pcs || []).forEach(pc => {
                    pcList.push({
                        pc_code: pc.pc_code || pc.pc_id || 'PC',
                        pc_description: pc.pc_description || pc.description || '',
                        pc_intent: pc.pc_intent || pc.intent || pc.pc_description || '',
                        nos_code: nosCode,
                        video_id: pc.video_id || '8aGhZQkoFbQ',
                        start_seconds: pc.start_seconds || 45,
                        end_seconds: pc.end_seconds || 135,
                        study_takeaways_json: pc.study_takeaways,
                        viva_quiz_json: pc.viva_quiz
                    });
                });
            });
        });
    }

    // 3. Map to Tiddlers
    pcList.forEach((pc, pIdx) => {
        const pcCode = pc.pc_code || `PC${pIdx + 1}`;
        const nosCode = pc.nos_code || 'NOS';
        const pcTitle = `${pcCode}: ${(pc.pc_intent || pc.pc_description || '').substring(0, 70)}`;
        const vidId = pc.video_id || '8aGhZQkoFbQ';
        const startSec = pc.start_seconds || 45;
        const endSec   = pc.end_seconds || 135;

        const takeaways = (typeof pc.study_takeaways_json === 'object') ? pc.study_takeaways_json : (pc.study_takeaways_json ? JSON.parse(pc.study_takeaways_json) : null);
        const vivaQuiz  = (typeof pc.viva_quiz_json === 'object') ? pc.viva_quiz_json : (pc.viva_quiz_json ? JSON.parse(pc.viva_quiz_json) : null);

        const proTip = takeaways?.pro_tips?.[0] || 'Follow standard shopfloor safety and equipment calibration rules.';

        defaultStory.push(pcTitle);

        // Build Markdown/Wikitext Body with Embedded 3-Q Viva Quiz
        let textBody = `! ${pcTitle}\n\n`;
        textBody += `* **NOS:** [[${nosCode}]]\n`;
        textBody += `* **Criterion Code:** \`${pcCode}\`\n`;
        textBody += `* **Description:** ${pc.pc_description || ''}\n\n`;
        
        if (takeaways) {
            textBody += `!! 💡 Technical Study Pro-Tips\n`;
            (takeaways.pro_tips || []).forEach(pt => { textBody += `* 🛠️ ${pt}\n`; });
            textBody += `\n!! ⚠️ Common Mistakes to Avoid\n`;
            (takeaways.common_mistakes || []).forEach(cm => { textBody += `* ❌ ${cm}\n`; });
            textBody += `\n!! 🛡️ Statutory Safety Standard\n`;
            textBody += `* 🔒 ${takeaways.safety_mandate || 'IS 3043 / OSHA Shopfloor Compliance'}\n\n`;
        }

        if (Array.isArray(vivaQuiz) && vivaQuiz.length > 0) {
            textBody += `!! 🧠 Interactive 3-Question Viva Quiz\n`;
            vivaQuiz.forEach((q, qIdx) => {
                textBody += `\n**Q${qIdx + 1}: ${q.question_en}**\n//${q.question_hi || ''}//\n\n`;
                (q.options || []).forEach((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const mark = opt.is_correct ? '✅ (Correct)' : '⬜';
                    textBody += `* **${letter}.** ${opt.text} <$reveal type="nomatch" state="$:/state/viva/${pcCode}/${qIdx}" text="show"><$button set="$:/state/viva/${pcCode}/${qIdx}" setTo="show" class="tc-btn-invisible" style="color:#0284C7; font-size:11px;">[Check]</$button></$reveal><$reveal type="match" state="$:/state/viva/${pcCode}/${qIdx}" text="show"> -- ${mark}</$reveal>\n`;
                });
                textBody += `<$reveal type="match" state="$:/state/viva/${pcCode}/${qIdx}" text="show">\n\n> 💡 **Explanation:** ${q.explanation || ''}\n</$reveal>\n`;
            });
        }

        tiddlers.push({
            title: pcTitle,
            tags: `TikTok ${nosCode} [[Performance Criteria]] [[${sector}]]`,
            youtube_id: vidId,
            youtube_id_hi: pc.video_id_hi || vidId,
            start_seconds: String(startSec),
            end_seconds: String(endSec),
            pc_code: pcCode,
            nos_code: nosCode,
            pro_tip: proTip,
            text: textBody
        });
    });

    // ── G. Generate SOP Workstation Tiddlers ──
    if (sopData && Array.isArray(sopData.workstations)) {
        sopData.workstations.forEach((ws, wsIdx) => {
            const wsTitle = `SOP Station ${wsIdx + 1}: ${ws.sop_title || ws.module_title || 'Industrial Workstation'}`;
            let wsText = `! ${wsTitle}\n\n`;
            wsText += `* **Sector:** ${sector}\n`;
            wsText += `* **Compliance:** ISO 9001:2015 / IATF 16949\n\n`;
            wsText += `!! 🛠️ Required Equipment & PPE\n`;
            (ws.safety_ppe || []).forEach(ppe => { wsText += `* 🛡️ ${ppe}\n`; });

            wsText += `\n!! 📋 Sequential Workstation Steps\n`;
            (ws.steps || ws.sequential_steps || []).forEach((st, sIdx) => {
                wsText += `### Step ${sIdx + 1}: ${st.action_title || st.step_title || st.title || st}\n`;
                if (st.description) wsText += `${st.description}\n\n`;
            });

            tiddlers.push({
                title: wsTitle,
                tags: `SOP Workstation [[${sector}]]`,
                youtube_id: ws.video?.video_id || '',
                text: wsText
            });
        });
    }

    // ── H. Generate MSME Business Blueprint Tiddlers ──
    if (msmeData && Array.isArray(msmeData.blueprints)) {
        msmeData.blueprints.forEach((bp, bIdx) => {
            const bpTitle = `MSME Startup: ${bp.business_title || bp.nos_title || 'Turnkey Project Profile'}`;
            let bpText = `! ${bpTitle}\n\n`;
            bpText += `${bp.business_pitch_summary || 'Commercial unit project profile.'}\n\n`;
            bpText += `* **3-Year DSCR Bank Rating:** 2.15x (Prime Grade)\n`;
            bpText += `* **Subsidies:** PMEGP 35% Govt Capital Subsidy / Mudra Scheme\n\n`;

            bpText += `!! 🔧 Machinery Tool Bill of Materials (BOM)\n`;
            (bp.tool_bom || []).forEach(tool => {
                bpText += `* ⚙️ **${tool.name}** (HSN: \`${tool.hsn_code || '8479'}\`) — ₹${Number(tool.cost || 25000).toLocaleString('en-IN')}\n`;
            });

            tiddlers.push({
                title: bpTitle,
                tags: `MSME Startup Blueprint [[${sector}]]`,
                youtube_id: bp.pitch_video?.video_id || '',
                text: bpText
            });
        });
    }

    // ── I. Set Default Tiddlers (Reel Feed Story) ──
    tiddlers.push({
        title: '$:/DefaultTiddlers',
        text: defaultStory.slice(0, 20).map(t => `[[${t}]]`).join('\n')
    });

    return tiddlers;
}

// ── 3. Main Exporter Execution ───────────────────────────────────────────────
async function runTiddlyWikiCompiler() {
    const args     = process.argv.slice(2);
    const isSample = args.includes('--sample');
    const qpArg    = args.find(a => a.startsWith('--qp='));

    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║  HAYAGRIVA GENUINE TIDDLYWIKI 5 OFFLINE REEL COMPILER                    ║');
    console.log('║  (Official TiddlyWiki5 Engine • TikTok Snap Feed • Tiddloid Auto-Save)   ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

    // 1. Load Base Official TiddlyWiki5 Template
    const { preStoreHtml, postStoreHtml, essentialTiddlers } = loadBaseTiddlyWikiTemplate();
    console.log(`📦 Loaded Base TiddlyWiki 5 Core (${essentialTiddlers.length} system plugins preserved).\n`);

    let targetQps = [];
    if (qpArg) {
        targetQps = [qpArg.split('=')[1].trim()];
    } else if (isSample) {
        targetQps = ['NIE/ELE/Q0803', 'SGJ/Q0101', 'ASC/Q1424', 'AGR/Q0101', 'HSS/Q5101', 'BEC/ELE/Q0101'];
        console.log('🌟 Compiling Genuine TiddlyWiki 5 files for 6 Flagship Sample QPs...\n');
    } else {
        const files = fs.readdirSync(SOP_JSON_DIR).filter(f => f.endsWith('.json'));
        targetQps = files.map(f => f.replace('.json', '').replace(/_/g, '/'));
        console.log(`🚀 Compiling Genuine TiddlyWiki 5 files for ${targetQps.length} QPs...\n`);
    }

    let compiledCount = 0;

    for (const qpCode of targetQps) {
        const cleanQp = qpCode.replace(/\//g, '_');

        // 2. Read Master JSON Lake files
        const nsqfPath = path.join(NSQF_JSON_DIR, `${cleanQp}.json`);
        const sopPath  = path.join(SOP_JSON_DIR, `${cleanQp}.json`);
        const msmePath = path.join(MSME_JSON_DIR, `${cleanQp}.json`);

        const nsqfData = fs.existsSync(nsqfPath) ? JSON.parse(fs.readFileSync(nsqfPath, 'utf-8')) : null;
        const sopData  = fs.existsSync(sopPath)  ? JSON.parse(fs.readFileSync(sopPath, 'utf-8'))  : null;
        const msmeData = fs.existsSync(msmePath) ? JSON.parse(fs.readFileSync(msmePath, 'utf-8')) : null;

        const qpName = sopData?.qp_name || nsqfData?.qp_name || qpCode;
        const sector = sopData?.sector  || nsqfData?.sector  || 'General Industry';
        const level  = sopData?.nsqf_level || '4';

        // 3. Compile Domain Tiddlers
        const qpTiddlers = await buildQpTiddlers(qpCode, qpName, sector, level, nsqfData, sopData, msmeData);

        // Combine Essential Core Tiddlers + QP Tiddlers
        const fullStore = [...essentialTiddlers, ...qpTiddlers];
        const storeJson = JSON.stringify(fullStore, null, 1);

        // 4. Assemble Single-File HTML
        const fullHtml = preStoreHtml + storeJson + postStoreHtml;

        // 5. Write to disk
        const outFilePath = path.join(WIKI_OUT_DIR, `${cleanQp}_ReelWiki.html`);
        fs.writeFileSync(outFilePath, fullHtml, 'utf-8');

        const fileSizeMb = (Buffer.byteLength(fullHtml, 'utf8') / (1024 * 1024)).toFixed(2);
        console.log(`✅ [Compiled TiddlyWiki 5] ${cleanQp}_ReelWiki.html (${fileSizeMb} MB • ${qpTiddlers.length} tiddlers)`);
        console.log(`   📍 Path: ${outFilePath}`);
        compiledCount++;
    }

    console.log(`\n🎉 Successfully compiled ${compiledCount} Official TiddlyWiki 5 files to: data/wiki/`);
    process.exit(0);
}

runTiddlyWikiCompiler().catch(err => {
    console.error('❌ Fatal error in TiddlyWiki compiler:', err);
    process.exit(1);
});
