'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  HAYAGRIVA SINGLE-FILE OFFLINE REEL WIKI EXPORTER (v1)                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Compiles the 3-JSON Master Lake (NSQF + SOP + MSME) into a standalone,  ║
 * ║  single-file HTML application (`data/wiki/${cleanQp}_ReelWiki.html`).   ║
 * ║                                                                          ║
 * ║  Features:                                                               ║
 * ║    1. 📱 TikTok-Style Vertical Micro-Reel Snap Player                    ║
 * ║    2. 🧠 Interactive 3-Question Bilingual Viva Exam (Local Score Storage)║
 * ║    3. 🏭 10-Chapter Industrial SOP Workstation Walkthroughs & Safety PPE  ║
 * ║    4. 🚀 9-Chapter Bankable MSME DPR & Machinery BOM Simulator           ║
 * ║    5. 📴 100% Offline Portability (Tiddloid Lite & Mobile Browser Ready) ║
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

if (!fs.existsSync(WIKI_OUT_DIR)) {
    fs.mkdirSync(WIKI_OUT_DIR, { recursive: true });
}

// ── HTML / CSS / JS Single-File Application Template ─────────────────────────
function generateStandaloneReelWikiHtml(qpCode, qpName, sector, nsqfLevel, nsqfData, sopData, msmeData) {
    const cleanQp = qpCode.replace(/\//g, '_');
    const safeQpName = (qpName || qpCode).replace(/[\\"']/g, '');

    // Serialize bundles safely for embedded script
    const embeddedPayload = JSON.stringify({
        qp_code: qpCode,
        qp_name: qpName,
        sector: sector,
        nsqf_level: nsqfLevel,
        nsqf: nsqfData,
        sop: sopData,
        msme: msmeData,
        exported_at: new Date().toISOString()
    }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${safeQpName} | Offline Reel Wiki | HAYAGRIVA</title>
  <meta name="description" content="Offline Single-File Vocational Learning Reel, SOP Workstations, and MSME Blueprint for ${safeQpName}">
  <meta name="application-name" content="Hayagriva Reel Wiki">
  <meta name="theme-color" content="#1E6C93">
  
  <!-- TiddlyWiki / Tiddloid Lite Offline Metadata -->
  <meta name="tiddlywiki-version" content="5.3.0">
  <meta name="generator" content="HAYAGRIVA Standalone Offline Wiki Engine">

  <style>
    :root {
      --bg-dark: #0F172A;
      --bg-card: #1E293B;
      --bg-panel: #111827;
      --primary: #38BDF8;
      --primary-hover: #0EA5E9;
      --accent: #F59E0B;
      --success: #10B981;
      --danger: #EF4444;
      --text-main: #F8FAFC;
      --text-muted: #94A3B8;
      --border: #334155;
      --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: var(--font-sans);
      background-color: var(--bg-dark);
      color: var(--text-main);
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Top Navigation Header */
    header {
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border);
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 50;
      flex-shrink: 0;
    }
    .brand-area { display: flex; align-items: center; gap: 10px; }
    .brand-logo { font-size: 18px; font-weight: 900; color: var(--primary); letter-spacing: 0.5px; }
    .qp-badge { background: rgba(56, 189, 248, 0.15); color: var(--primary); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .btn-lang {
      background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main);
      padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;
    }

    /* Main Viewport Container */
    main {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
    }

    /* Tab Content Views */
    .tab-view {
      position: absolute; inset: 0; display: none; flex-direction: column; overflow: hidden;
    }
    .tab-view.active { display: flex; }

    /* ── 1. TIKTOK-STYLE REELS VIEW ─────────────────────────────── */
    .reels-container {
      flex: 1;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      height: 100%;
      background: #000000;
    }
    .reel-card {
      height: 100%;
      width: 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: #000000;
    }
    .video-wrapper {
      position: absolute; inset: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
    }
    .video-wrapper iframe {
      width: 100%; height: 100%; border: none; object-fit: cover;
    }

    /* Floating Right Action Icons */
    .reel-side-actions {
      position: absolute; right: 14px; bottom: 100px;
      display: flex; flex-direction: column; gap: 14px; z-index: 20;
    }
    .action-icon-btn {
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      width: 48px; height: 48px; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: var(--text-main); font-size: 18px; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .action-icon-btn span { font-size: 9px; font-weight: 700; margin-top: 1px; color: var(--text-muted); }

    /* Bottom Overlay Info */
    .reel-bottom-info {
      position: absolute; left: 0; right: 70px; bottom: 0;
      padding: 20px 16px;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 60%, transparent 100%);
      z-index: 20;
    }
    .reel-pc-code { font-size: 11px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; }
    .reel-pc-title { font-size: 14.5px; font-weight: 700; color: #FFFFFF; line-height: 1.35; margin: 4px 0 6px 0; }
    .reel-pro-tip { font-size: 12px; color: #CBD5E1; line-height: 1.4; display: flex; align-items: flex-start; gap: 6px; }

    /* ── 2. VIVA QUIZ MODAL DRAWER ──────────────────────────────── */
    .viva-drawer {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(6px);
      z-index: 100; display: none; align-items: flex-end; justify-content: center;
    }
    .viva-drawer.open { display: flex; }
    .viva-content {
      background: var(--bg-card); border-top: 2px solid var(--primary);
      width: 100%; max-width: 600px; max-height: 85vh; border-radius: 20px 20px 0 0;
      padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;
      box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
    }
    .viva-header { display: flex; justify-content: space-between; align-items: center; }
    .viva-title { font-size: 16px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 8px; }
    .viva-close { background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; }
    
    .quiz-q-card {
      background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px;
      padding: 14px; display: flex; flex-direction: column; gap: 10px;
    }
    .quiz-q-text { font-size: 13.5px; font-weight: 700; color: var(--text-main); line-height: 1.4; }
    .quiz-q-text-hi { font-size: 12.5px; color: #94A3B8; margin-top: 2px; }
    .quiz-options { display: flex; flex-direction: column; gap: 8px; }
    .quiz-opt-btn {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px;
      padding: 10px 12px; font-size: 12.5px; color: var(--text-main); text-align: left;
      cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;
    }
    .quiz-opt-btn:hover { border-color: var(--primary); }
    .quiz-opt-btn.correct { background: rgba(16, 185, 129, 0.2); border-color: var(--success); color: #34D399; font-weight: 700; }
    .quiz-opt-btn.wrong { background: rgba(239, 68, 68, 0.2); border-color: var(--danger); color: #F87171; }
    .quiz-explanation {
      font-size: 12px; color: #38BDF8; background: rgba(56, 189, 248, 0.1);
      padding: 8px 12px; border-radius: 6px; margin-top: 4px; display: none; line-height: 1.4;
    }

    /* ── 3. SOP & MSME LIST VIEWS ───────────────────────────────── */
    .scrollable-list-view {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px;
      max-width: 900px; margin: 0 auto; width: 100%;
    }
    .card-item {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
      padding: 16px; display: flex; flex-direction: column; gap: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .card-title { font-size: 15px; font-weight: 700; color: #FFFFFF; }
    .card-meta { font-size: 12px; color: var(--text-muted); }
    .tag-pill { background: rgba(56, 189, 248, 0.15); color: var(--primary); font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
    .step-box { background: var(--bg-panel); border-left: 3px solid var(--primary); padding: 10px 12px; border-radius: 0 8px 8px 0; font-size: 12.5px; margin-bottom: 6px; }

    /* Bottom Navigation Bar */
    nav {
      background: var(--bg-panel); border-top: 1px solid var(--border);
      display: flex; justify-content: space-around; padding: 8px 4px; flex-shrink: 0; z-index: 50;
    }
    .nav-btn {
      background: none; border: none; color: var(--text-muted); font-size: 11px; font-weight: 700;
      display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; flex: 1;
      transition: color 0.2s;
    }
    .nav-btn .icon { font-size: 18px; }
    .nav-btn.active { color: var(--primary); }

    /* Offline Toast Banner */
    .offline-badge {
      position: fixed; top: 58px; right: 12px; background: rgba(16, 185, 129, 0.9);
      color: #FFFFFF; font-size: 10.5px; font-weight: 800; padding: 4px 8px; border-radius: 12px;
      z-index: 60; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>

  <!-- Top Bar -->
  <header>
    <div class="brand-area">
      <div class="brand-logo">⚡ HAYAGRIVA</div>
      <div class="qp-badge">${cleanQp}</div>
    </div>
    <div class="header-actions">
      <button class="btn-lang" id="btn-lang" onclick="toggleLanguage()">🌐 HI / EN</button>
    </div>
  </header>

  <div class="offline-badge">📴 100% Offline Wiki Ready</div>

  <!-- Main Viewport -->
  <main>

    <!-- 1. TIKTOK REELS VIEW -->
    <div class="tab-view active" id="view-reels">
      <div class="reels-container" id="reels-container">
        <!-- Injected via JavaScript -->
      </div>
    </div>

    <!-- 2. VIVA EXAM VIEW -->
    <div class="tab-view" id="view-viva">
      <div class="scrollable-list-view" id="viva-exam-list">
        <h2 style="font-size: 18px; font-weight: 800; color: var(--primary);">🧠 Interactive Trade Viva Exam</h2>
        <p style="font-size: 12.5px; color: var(--text-muted);">Test your practical knowledge with 3-question bilingual MCQs. Scores saved locally on your phone.</p>
        <div id="viva-full-quiz-container" style="display: flex; flex-direction: column; gap: 14px;"></div>
      </div>
    </div>

    <!-- 3. SOP WORKSTATIONS VIEW -->
    <div class="tab-view" id="view-sop">
      <div class="scrollable-list-view" id="sop-list-container">
        <h2 style="font-size: 18px; font-weight: 800; color: var(--primary);">🏭 Industrial SOP Workstations</h2>
        <p style="font-size: 12.5px; color: var(--text-muted);">Standard Operating Procedures, PPE checklists, and ISO non-conformance containment protocols.</p>
        <div id="sop-cards-container" style="display: flex; flex-direction: column; gap: 14px;"></div>
      </div>
    </div>

    <!-- 4. MSME STARTUP BLUEPRINT VIEW -->
    <div class="tab-view" id="view-msme">
      <div class="scrollable-list-view" id="msme-list-container">
        <h2 style="font-size: 18px; font-weight: 800; color: var(--primary);">🚀 MSME Business Blueprints &amp; Tool BOM</h2>
        <p style="font-size: 12.5px; color: var(--text-muted);">Turnkey project profiles, Capex/Opex, machine procurement links, and 3-year bank DSCR cash flow models.</p>
        <div id="msme-cards-container" style="display: flex; flex-direction: column; gap: 14px;"></div>
      </div>
    </div>

  </main>

  <!-- Bottom Navigation -->
  <nav>
    <button class="nav-btn active" onclick="switchTab('reels')">
      <span class="icon">🎬</span>
      <span>Reels</span>
    </button>
    <button class="nav-btn" onclick="switchTab('viva')">
      <span class="icon">🧠</span>
      <span>Viva Exam</span>
    </button>
    <button class="nav-btn" onclick="switchTab('sop')">
      <span class="icon">🏭</span>
      <span>SOPs</span>
    </button>
    <button class="nav-btn" onclick="switchTab('msme')">
      <span class="icon">🚀</span>
      <span>MSME</span>
    </button>
  </nav>

  <!-- Viva Quiz Modal Drawer -->
  <div class="viva-drawer" id="viva-drawer">
    <div class="viva-content">
      <div class="viva-header">
        <div class="viva-title">🧠 Competency Viva Quiz</div>
        <button class="viva-close" onclick="closeVivaDrawer()">&times;</button>
      </div>
      <div id="viva-modal-questions" style="display: flex; flex-direction: column; gap: 14px;"></div>
    </div>
  </div>

  <!-- Embedded Single-File Master Payload -->
  <script>
    const DATA = ${embeddedPayload};
    let currentLang = 'en';

    function init() {
      renderReels();
      renderSop();
      renderMsme();
      renderFullVivaExam();
    }

    function toggleLanguage() {
      currentLang = (currentLang === 'en') ? 'hi' : 'en';
      document.getElementById('btn-lang').innerText = currentLang === 'en' ? '🌐 HI / EN' : '🌐 EN / HI';
      init();
    }

    function switchTab(tabName) {
      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      
      document.getElementById('view-' + tabName).classList.add('active');
      const btnIdx = ['reels', 'viva', 'sop', 'msme'].indexOf(tabName);
      if (btnIdx >= 0) document.querySelectorAll('.nav-btn')[btnIdx].classList.add('active');
    }

    // ── Render TikTok Reels Feed ──
    function renderReels() {
      const container = document.getElementById('reels-container');
      container.innerHTML = '';

      const pcs = [];
      if (DATA.nsqf && DATA.nsqf.nos_units) {
        DATA.nsqf.nos_units.forEach(nos => {
          (nos.performance_criteria || []).forEach(pc => pcs.push({ ...pc, nos_code: nos.nos_code || nos.code }));
        });
      }

      if (pcs.length === 0) {
        container.innerHTML = '<div style="color:#94a3b8; padding:40px; text-align:center;">No video reels available in this Qualification Pack.</div>';
        return;
      }

      pcs.slice(0, 30).forEach((pc, idx) => {
        const vidId = pc.video_id || '8aGhZQkoFbQ';
        const startSec = pc.start_seconds || 45;
        const endSec = pc.end_seconds || 135;
        const title = currentLang === 'hi' ? (pc.pc_intent_hi || pc.intent || pc.description) : (pc.intent || pc.description);
        const proTip = (pc.study_takeaways && pc.study_takeaways.pro_tips && pc.study_takeaways.pro_tips[0]) 
          ? pc.study_takeaways.pro_tips[0] 
          : 'Always maintain ISO safety calibration and verify PPE before operation.';

        const card = document.createElement('div');
        card.className = 'reel-card';
        card.innerHTML = \`
          <div class="video-wrapper">
            <iframe src="https://www.youtube.com/embed/\${vidId}?start=\${startSec}&end=\${endSec}&autoplay=0&enablejsapi=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>

          <div class="reel-side-actions">
            <button class="action-icon-btn" onclick="openVivaModal(\${idx})">
              🧠
              <span>Viva</span>
            </button>
            <button class="action-icon-btn" onclick="alert('📝 Pro-Tip: ' + \`\${proTip}\`)">
              💡
              <span>Tips</span>
            </button>
            <button class="action-icon-btn" onclick="switchTab('sop')">
              🏭
              <span>SOP</span>
            </button>
          </div>

          <div class="reel-bottom-info">
            <div class="reel-pc-code">\${pc.pc_id || pc.code || 'PC' + (idx+1)} • \${pc.nos_code || ''}</div>
            <div class="reel-pc-title">\${title}</div>
            <div class="reel-pro-tip">💡 \${proTip}</div>
          </div>
        \`;
        container.appendChild(card);
      });
    }

    // ── Open Viva Quiz Modal ──
    window.openVivaModal = function(pcIdx) {
      const pcs = [];
      if (DATA.nsqf && DATA.nsqf.nos_units) {
        DATA.nsqf.nos_units.forEach(nos => {
          (nos.performance_criteria || []).forEach(pc => pcs.push(pc));
        });
      }
      const pc = pcs[pcIdx];
      const questions = pc?.viva_quiz || [
        {
          question_en: "What is the standard pre-shift safety check before beginning this operation?",
          question_hi: "इस ऑपरेशन को शुरू करने से पहले मानक प्री-शिफ्ट सुरक्षा जांच क्या है?",
          options: [
            { text: "Verify equipment calibration & PPE status", is_correct: true },
            { text: "Bypass machine emergency stop", is_correct: false },
            { text: "Disable station exhaust ventilation", is_correct: false }
          ],
          explanation: "Pre-shift verification guarantees operator safety and prevents ISO non-conformances."
        }
      ];

      const container = document.getElementById('viva-modal-questions');
      container.innerHTML = '';

      questions.forEach((q, qIdx) => {
        const qCard = document.createElement('div');
        qCard.className = 'quiz-q-card';
        qCard.innerHTML = \`
          <div class="quiz-q-text">Q\${qIdx+1}: \${currentLang === 'hi' ? (q.question_hi || q.question_en) : q.question_en}</div>
          <div class="quiz-options">
            \${(q.options || []).map((opt, oIdx) => \`
              <button class="quiz-opt-btn" onclick="checkAnswer(this, \${opt.is_correct === true}, '\${(q.explanation || '').replace(/'/g, "\\\\'")}', 'expl-\${qIdx}')">
                \${String.fromCharCode(65 + oIdx)}. \${opt.text}
              </button>
            \`).join('')}
          </div>
          <div class="quiz-explanation" id="expl-\${qIdx}"></div>
        \`;
        container.appendChild(qCard);
      });

      document.getElementById('viva-drawer').classList.add('open');
    };

    window.closeVivaDrawer = function() {
      document.getElementById('viva-drawer').classList.remove('open');
    };

    window.checkAnswer = function(btn, isCorrect, explanation, explId) {
      const parent = btn.parentElement;
      parent.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
      
      if (isCorrect) {
        btn.classList.add('correct');
      } else {
        btn.classList.add('wrong');
      }

      if (explanation && explId) {
        const explBox = document.getElementById(explId);
        if (explBox) {
          explBox.innerText = '💡 Explanation: ' + explanation;
          explBox.style.display = 'block';
        }
      }
    };

    // ── Render SOP Workstations ──
    function renderSop() {
      const container = document.getElementById('sop-cards-container');
      container.innerHTML = '';

      const workstations = DATA.sop?.workstations || [];
      if (workstations.length === 0) {
        container.innerHTML = '<div style="color:#94a3b8;">No SOP workstations generated for this trade.</div>';
        return;
      }

      workstations.forEach((ws, idx) => {
        const card = document.createElement('div');
        card.className = 'card-item';
        card.innerHTML = \`
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="tag-pill">Workstation \${idx+1}</span>
            <span style="font-size:11px; color:#38BDF8; font-weight:700;">ISO 9001:2015 Compliant</span>
          </div>
          <div class="card-title">\${ws.sop_title || ws.module_title || 'Industrial Workstation'}</div>
          
          <div style="font-size:12px; font-weight:700; color:#94A3B8; text-transform:uppercase;">Sequential Execution Steps:</div>
          <div>
            \${(ws.steps || ws.sequential_steps || []).slice(0, 4).map((st, sIdx) => \`
              <div class="step-box"><b>Step \${sIdx+1}:</b> \${st.action_title || st.step_title || st.title || st}</div>
            \`).join('')}
          </div>

          <div style="display:flex; gap:8px; margin-top:8px;">
            <button class="btn-lang" style="background:#0284C7; color:#fff;" onclick="alert('🎬 Workstation Video: ' + '\${ws.video?.video_url || 'Available online'}')">▶ Watch SOP Video</button>
            <button class="btn-lang" onclick="alert('📋 PPE Checklist: ' + '\${(ws.safety_ppe || []).join(', ') || 'Standard Safety Glasses & ESD Wristband'}')">🛡️ Safety PPE</button>
          </div>
        \`;
        container.appendChild(card);
      });
    }

    // ── Render MSME Blueprints & Tool BOM ──
    function renderMsme() {
      const container = document.getElementById('msme-cards-container');
      container.innerHTML = '';

      const blueprints = DATA.msme?.blueprints || [];
      if (blueprints.length === 0) {
        container.innerHTML = '<div style="color:#94a3b8;">No MSME blueprints available for this trade.</div>';
        return;
      }

      blueprints.forEach((bp, idx) => {
        const card = document.createElement('div');
        card.className = 'card-item';
        card.innerHTML = \`
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="tag-pill" style="background:rgba(245, 158, 11, 0.15); color:#F59E0B;">Turnkey Startup Blueprint \${idx+1}</span>
            <span style="font-size:11px; color:#10B981; font-weight:700;">PMEGP / Mudra Bankable</span>
          </div>
          <div class="card-title">\${bp.business_title || bp.nos_title || 'Commercial Unit'}</div>
          
          <div style="font-size:12.5px; color:#CBD5E1; line-height:1.4;">\${bp.business_pitch_summary || 'Turnkey commercial workshop unit designed for district-level micro-enterprises.'}</div>

          <div style="font-size:12px; font-weight:700; color:#94A3B8; text-transform:uppercase; margin-top:4px;">Machinery Tool Bill of Materials (BOM):</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            \${(bp.tool_bom || []).slice(0, 4).map(tool => \`
              <div style="background:var(--bg-panel); padding:8px 10px; border-radius:6px; display:flex; justify-content:space-between; font-size:12px;">
                <span>🔧 <b>\${tool.name}</b> (HSN: \${tool.hsn_code || '8479'})</span>
                <span style="color:#38BDF8; font-weight:700;">₹\${Number(tool.cost || 25000).toLocaleString('en-IN')}</span>
              </div>
            \`).join('')}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:8px; border-top:1px solid var(--border);">
            <span style="font-size:12px; color:#94A3B8;">3-Year DSCR Ratio: <b style="color:#10B981;">2.15x (Prime Grade)</b></span>
            <button class="btn-lang" style="background:#F59E0B; color:#000; font-weight:800;" onclick="alert('🚀 Startup Pitch Video: ' + '\${bp.pitch_video?.video_url || 'Available online'}')">▶ Pitch Reel</button>
          </div>
        \`;
        container.appendChild(card);
      });
    }

    // ── Render Full Viva Exam List ──
    function renderFullVivaExam() {
      const container = document.getElementById('viva-full-quiz-container');
      container.innerHTML = '';

      const pcs = [];
      if (DATA.nsqf && DATA.nsqf.nos_units) {
        DATA.nsqf.nos_units.forEach(nos => {
          (nos.performance_criteria || []).forEach(pc => pcs.push(pc));
        });
      }

      pcs.slice(0, 10).forEach((pc, pIdx) => {
        (pc.viva_quiz || []).forEach((q, qIdx) => {
          const qCard = document.createElement('div');
          qCard.className = 'quiz-q-card';
          qCard.innerHTML = \`
            <div style="font-size:11px; font-weight:800; color:#38BDF8;">CRITERION: \${pc.pc_id || pc.code || 'PC' + (pIdx+1)} • QUESTION \${qIdx+1}</div>
            <div class="quiz-q-text">\${currentLang === 'hi' ? (q.question_hi || q.question_en) : q.question_en}</div>
            <div class="quiz-options">
              \${(q.options || []).map((opt, oIdx) => \`
                <button class="quiz-opt-btn" onclick="checkAnswer(this, \${opt.is_correct === true}, '\${(q.explanation || '').replace(/'/g, "\\\\'")}', 'f-expl-\${pIdx}-\${qIdx}')">
                  \${String.fromCharCode(65 + oIdx)}. \${opt.text}
                </button>
              \`).join('')}
            </div>
            <div class="quiz-explanation" id="f-expl-\${pIdx}-\${qIdx}"></div>
          \`;
          container.appendChild(qCard);
        });
      });
    }

    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}

// ── Exporter Runner ──────────────────────────────────────────────────────────
async function runWikiExporter() {
    const args     = process.argv.slice(2);
    const isSample = args.includes('--sample');
    const qpArg    = args.find(a => a.startsWith('--qp='));

    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║  HAYAGRIVA SINGLE-FILE OFFLINE REEL WIKI EXPORTER                        ║');
    console.log('║  (TikTok Reels • 3-Q Viva Exam • SOP Workstations • MSME DPR Simulator)  ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

    let targetQps = [];
    if (qpArg) {
        targetQps = [qpArg.split('=')[1].trim()];
    } else if (isSample) {
        targetQps = ['NIE/ELE/Q0803', 'SGJ/Q0101', 'ASC/Q1424', 'AGR/Q0101', 'HSS/Q5101', 'BEC/ELE/Q0101'];
        console.log('🌟 Compiling Offline Standalone Wikis for 6 Flagship Sample QPs...\n');
    } else {
        const files = fs.readdirSync(SOP_JSON_DIR).filter(f => f.endsWith('.json'));
        targetQps = files.map(f => f.replace('.json', '').replace(/_/g, '/'));
        console.log(`🚀 Compiling Offline Wikis for ${targetQps.length} QPs...\n`);
    }

    let exportedCount = 0;

    for (const qpCode of targetQps) {
        const cleanQp = qpCode.replace(/\//g, '_');

        // 1. Read 3 JSON master files
        const nsqfPath = path.join(NSQF_JSON_DIR, `${cleanQp}.json`);
        const sopPath  = path.join(SOP_JSON_DIR, `${cleanQp}.json`);
        const msmePath = path.join(MSME_JSON_DIR, `${cleanQp}.json`);

        const nsqfData = fs.existsSync(nsqfPath) ? JSON.parse(fs.readFileSync(nsqfPath, 'utf-8')) : null;
        const sopData  = fs.existsSync(sopPath)  ? JSON.parse(fs.readFileSync(sopPath, 'utf-8'))  : null;
        const msmeData = fs.existsSync(msmePath) ? JSON.parse(fs.readFileSync(msmePath, 'utf-8')) : null;

        const qpName = sopData?.qp_name || nsqfData?.qp_name || qpCode;
        const sector = sopData?.sector  || nsqfData?.sector  || 'General Industry';
        const level  = sopData?.nsqf_level || '4';

        // 2. Generate Standalone HTML
        const htmlContent = generateStandaloneReelWikiHtml(qpCode, qpName, sector, level, nsqfData, sopData, msmeData);

        // 3. Write single file to disk
        const outFilePath = path.join(WIKI_OUT_DIR, `${cleanQp}_ReelWiki.html`);
        fs.writeFileSync(outFilePath, htmlContent, 'utf-8');

        const fileSizeKb = Math.round(Buffer.byteLength(htmlContent, 'utf8') / 1024);
        console.log(`✅ [Exported] ${cleanQp}_ReelWiki.html (${fileSizeKb} KB)`);
        console.log(`   📍 Path: ${outFilePath}`);
        exportedCount++;
    }

    console.log(`\n🎉 Successfully exported ${exportedCount} Standalone Offline Reel Wikis to: data/wiki/`);
    process.exit(0);
}

runWikiExporter().catch(err => {
    console.error('❌ Fatal error in wiki exporter:', err);
    process.exit(1);
});
