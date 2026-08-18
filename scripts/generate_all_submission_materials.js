'use strict';

/**
 * 📄 Complete Design Documents & Supporting Materials Generator
 * Generates high-res PNGs & clean PDFs for:
 * 1. Architecture Diagram
 * 2. User Flow Diagram
 * 3. Other Supporting Materials (Executive Summary & Data Governance)
 * 4. Consolidated 3-page PDF (under 5MB)
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const outputDir = path.join('/Users/atulgrover/Desktop', 'YouTube_API_Evidence');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function generateAll() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // -------------------------------------------------------------
    // 1. Architecture Diagram
    // -------------------------------------------------------------
    const pageArch = await browser.newPage();
    await pageArch.setViewport({ width: 1400, height: 950, deviceScaleFactor: 2 });
    const archHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto+Mono:wght@400;500&family=Lato:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 30px; background: #0B1120; font-family: 'Lato', sans-serif; color: #FFFFFF; }
        .canvas { background: #1E293B; border: 2px solid #334155; border-radius: 20px; padding: 35px; max-width: 1320px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 28px; }
        .title { font-family: 'Google Sans', sans-serif; font-size: 27px; font-weight: 700; color: #38BDF8; }
        .subtitle { font-size: 14px; color: #94A3B8; margin-top: 4px; }
        .badge { background: #0284C7; color: #FFF; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card { background: #0F172A; border: 1px solid #334155; border-radius: 14px; padding: 22px; }
        .card-header { font-family: 'Google Sans', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .card.frontend .card-header { color: #60A5FA; }
        .card.backend .card-header { color: #34D399; }
        .card.external .card-header { color: #F87171; }
        .item-list { list-style: none; padding: 0; margin: 0; }
        .item-list li { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 9px 12px; margin-bottom: 9px; font-size: 13px; line-height: 1.45; }
        .item-list li strong { color: #F1F5F9; }
        
        .api-flow { margin-top: 24px; background: #0F172A; border: 1px dashed #38BDF8; border-radius: 14px; padding: 18px; text-align: center; }
        .api-flow-title { font-family: 'Google Sans', sans-serif; font-size: 15px; font-weight: 700; color: #38BDF8; margin-bottom: 10px; }
        .flow-steps { display: flex; justify-content: space-around; align-items: center; font-size: 12.5px; }
        .flow-step { background: #1E293B; border: 1px solid #475569; padding: 10px 14px; border-radius: 8px; color: #E2E8F0; max-width: 220px; }
        .flow-arrow { color: #38BDF8; font-size: 20px; font-weight: bold; }
        .compliance-bar { margin-top: 18px; padding: 12px 18px; background: rgba(16,185,129,0.1); border: 1px solid #10B981; border-radius: 10px; font-size: 12.5px; color: #A7F3D0; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="canvas">
        <div class="header">
          <div>
            <div class="title">HAYAGRIVA System Architecture &amp; YouTube API Integration</div>
            <div class="subtitle">Universal Integrated Professional Environment (IPE) &amp; NSQF Skillpedia</div>
          </div>
          <span class="badge">Architecture Design</span>
        </div>

        <div class="grid">
          <!-- 1. Client Layer -->
          <div class="card frontend">
            <div class="card-header">💻 1. Client Applications</div>
            <ul class="item-list">
              <li><strong>Web Portal (hayagriva.app):</strong> Responsive web interface for Students, Employees &amp; Professionals.</li>
              <li><strong>Desktop IPE:</strong> Local-first air-gapped environment with local encrypted vaults (.vlt).</li>
              <li><strong>Standard YouTube Embed Player:</strong> Official iframe player with strict compliance to Google/YouTube Terms of Service.</li>
            </ul>
          </div>

          <!-- 2. Core Backend Layer -->
          <div class="card backend">
            <div class="card-header">⚙️ 2. Core Backend &amp; Data Engine</div>
            <ul class="item-list">
              <li><strong>Express API Gateway:</strong> Stateless micro-service router for public educational search.</li>
              <li><strong>NSQF 5-Table Database:</strong> Curated taxonomy of 2,176 NCVET Job Roles &amp; 207,000 criteria.</li>
              <li><strong>7-Day Ephemeral Cache:</strong> Short-term operational cache (7-day TTL auto-purge) to prevent rate-limit exhaustion.</li>
              <li><strong>AI Quality Evaluator:</strong> Validates video title relevancy against vocational criteria.</li>
            </ul>
          </div>

          <!-- 3. Third-Party Integrations -->
          <div class="card external">
            <div class="card-header">🌐 3. Third-Party Integrations &amp; Open Standards</div>
            <ul class="item-list">
              <li><strong>YouTube Data API v3:</strong> Official search.list endpoint for 100% free educational demonstrations.</li>
              <li><strong>NCVET National Framework:</strong> Open Government Data (OGD) vocational curriculum standards.</li>
              <li><strong>Sarvam AI:</strong> Contextual intent &amp; search query synthesis.</li>
            </ul>
          </div>
        </div>

        <div class="api-flow">
          <div class="api-flow-title">🔄 Read-Only YouTube API Educational Retrieval Flow (100% Free Public Access)</div>
          <div class="flow-steps">
            <div class="flow-step">1. User selects NSQF Job Role (e.g. Solar PV Installer)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">2. Backend checks 7-Day Ephemeral Cache</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">3. YouTube Data API (search.list) for new queries</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">4. Client renders standard YouTube iframe player</div>
          </div>
        </div>

        <div class="compliance-bar">
          <span>✅ <strong>Zero Storage:</strong> No video/audio files downloaded or cached.</span>
          <span>✅ <strong>7-Day Ephemeral Cache:</strong> Automated daily purge of stale metadata.</span>
          <span>✅ <strong>100% Free Public Access:</strong> Zero paywalls, zero monetization of video content.</span>
        </div>
      </div>
    </body>
    </html>
    `;
    await pageArch.setContent(archHtml, { waitUntil: 'domcontentloaded' });
    await pageArch.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 400));
    
    const archPng = path.join(outputDir, 'Architecture_Diagram_HAYAGRIVA.png');
    const archPdf = path.join(outputDir, 'Architecture_Diagram_HAYAGRIVA.pdf');
    await pageArch.screenshot({ path: archPng, fullPage: true });
    await pageArch.pdf({ path: archPdf, format: 'A4', landscape: true, printBackground: true });
    console.log(`✅ Architecture Diagram saved: PNG + PDF`);

    // -------------------------------------------------------------
    // 2. User Flow Diagram
    // -------------------------------------------------------------
    const pageFlow = await browser.newPage();
    await pageFlow.setViewport({ width: 1400, height: 950, deviceScaleFactor: 2 });
    const flowHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 30px; background: #0B1120; font-family: 'Lato', sans-serif; color: #FFFFFF; }
        .canvas { background: #1E293B; border: 2px solid #334155; border-radius: 20px; padding: 35px; max-width: 1320px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 28px; }
        .title { font-family: 'Google Sans', sans-serif; font-size: 27px; font-weight: 700; color: #38BDF8; }
        .subtitle { font-size: 14px; color: #94A3B8; margin-top: 4px; }
        .badge { background: #059669; color: #FFF; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .timeline { display: flex; flex-direction: column; gap: 16px; }
        .step-row { display: flex; align-items: center; gap: 18px; }
        .step-num { width: 42px; height: 42px; border-radius: 50%; background: #0284C7; color: #FFF; font-weight: 700; font-size: 17px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-content { flex: 1; background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 16px 22px; }
        .step-title { font-family: 'Google Sans', sans-serif; font-size: 16px; font-weight: 700; color: #F1F5F9; margin-bottom: 5px; }
        .step-desc { font-size: 13px; color: #94A3B8; line-height: 1.5; }
        .highlight { color: #38BDF8; font-weight: 600; }
        .compliance-pill { display: inline-block; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); border-radius: 6px; padding: 2px 8px; font-size: 11.5px; color: #38BDF8; margin-left: 8px; }
      </style>
    </head>
    <body>
      <div class="canvas">
        <div class="header">
          <div>
            <div class="title">HAYAGRIVA Student &amp; Vocational Learner User Flow</div>
            <div class="subtitle">End-to-End Educational Micro-Learning Journey with YouTube API</div>
          </div>
          <span class="badge">User Flow Map</span>
        </div>

        <div class="timeline">
          <div class="step-row">
            <div class="step-num">1</div>
            <div class="step-content">
              <div class="step-title">Role &amp; Sector Discovery <span class="compliance-pill">Discovery</span></div>
              <div class="step-desc">Student browses 41 national sectors (Agriculture, Automotive, Healthcare, IT-ITeS) and chooses a targeted Qualification Pack (e.g. <span class="highlight">AGR/Q0101 Paddy Cultivator</span>).</div>
            </div>
          </div>

          <div class="step-row">
            <div class="step-num">2</div>
            <div class="step-content">
              <div class="step-title">Curriculum &amp; 11-Step Reel Breakdown <span class="compliance-pill">Curriculum Mapping</span></div>
              <div class="step-desc">The platform loads the official NSQF National Occupational Standards (NOS) and displays the interactive 11-chapter micro-learning curriculum with step-by-step competency goals.</div>
            </div>
          </div>

          <div class="step-row">
            <div class="step-num">3</div>
            <div class="step-content">
              <div class="step-title">Practical Demonstration Retrieval <span class="compliance-pill">YouTube Data API v3</span></div>
              <div class="step-desc">System retrieves highly relevant instructional video tutorials via <span class="highlight">YouTube Data API v3 (search.list)</span>, validated by AI for 90%+ vocational accuracy. Caching prevents redundant API requests.</div>
            </div>
          </div>

          <div class="step-row">
            <div class="step-num">4</div>
            <div class="step-content">
              <div class="step-title">In-Platform Video Learning &amp; Progress Tracking <span class="compliance-pill">Standard IFrame Player</span></div>
              <div class="step-desc">The student watches the demonstration using the <span class="highlight">standard YouTube iframe player</span>, completes performance criteria checklist items, and tracks skill mastery.</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
    await pageFlow.setContent(flowHtml, { waitUntil: 'domcontentloaded' });
    await pageFlow.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 400));

    const flowPng = path.join(outputDir, 'User_Flow_Diagram_HAYAGRIVA.png');
    const flowPdf = path.join(outputDir, 'User_Flow_Diagram_HAYAGRIVA.pdf');
    await pageFlow.screenshot({ path: flowPng, fullPage: true });
    await pageFlow.pdf({ path: flowPdf, format: 'A4', landscape: true, printBackground: true });
    console.log(`✅ User Flow Diagram saved: PNG + PDF`);

    // -------------------------------------------------------------
    // 3. Other Supporting Materials: Executive Summary & Policy Compliance
    // -------------------------------------------------------------
    const pageSupport = await browser.newPage();
    await pageSupport.setViewport({ width: 1400, height: 950, deviceScaleFactor: 2 });
    const supportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Lato:wght@400;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 30px; background: #0B1120; font-family: 'Lato', sans-serif; color: #FFFFFF; }
        .canvas { background: #1E293B; border: 2px solid #334155; border-radius: 20px; padding: 35px; max-width: 1320px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 25px; }
        .title { font-family: 'Google Sans', sans-serif; font-size: 26px; font-weight: 700; color: #38BDF8; }
        .subtitle { font-size: 14px; color: #94A3B8; margin-top: 4px; }
        .badge { background: #7C3AED; color: #FFF; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
        .card-title { font-family: 'Google Sans', sans-serif; font-size: 16px; font-weight: 700; color: #38BDF8; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .text { font-size: 13px; color: #CBD5E1; line-height: 1.55; }
        .text p { margin-top: 0; margin-bottom: 10px; }
        
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-list li { font-size: 13px; color: #E2E8F0; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; }
        .bullet-list li span.icon { color: #10B981; font-weight: bold; }
        
        .table-wrap { margin-top: 20px; background: #0F172A; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left; }
        th { background: #1E293B; color: #94A3B8; padding: 10px 16px; border-bottom: 1px solid #334155; font-weight: 600; }
        td { padding: 10px 16px; border-bottom: 1px solid #1E293B; color: #E2E8F0; }
        tr:last-child td { border-bottom: none; }
        .tag { background: rgba(56,189,248,0.15); color: #38BDF8; padding: 2px 8px; border-radius: 4px; font-family: 'Roboto Mono', monospace; font-size: 11.5px; }
      </style>
    </head>
    <body>
      <div class="canvas">
        <div class="header">
          <div>
            <div class="title">HAYAGRIVA Platform Overview &amp; YouTube API Compliance Statement</div>
            <div class="subtitle">Educational Vocational Enablement for 2,176 NSQF National Qualifications</div>
          </div>
          <span class="badge">Supporting Documentation</span>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title">📖 Project Purpose &amp; Value Proposition</div>
            <div class="text">
              <p>HAYAGRIVA is an Indian National Qualification Framework (NSQF) educational platform designed to empower students and vocational candidates across 41 sectors.</p>
              <p>The platform aggregates structured government curriculum standards (2,176 Job Roles, 207,000 performance criteria) and pairs them with high-quality practical demonstration videos retrieved dynamically via YouTube Data API v3.</p>
            </div>
          </div>

          <div class="card">
            <div class="card-title">🛡️ Data Governance &amp; Policy Adherence</div>
            <ul class="bullet-list">
              <li><span class="icon">✓</span> <strong>Read-Only API Access:</strong> Only queries <code class="tag">search.list</code> and <code class="tag">videos.list</code>.</li>
              <li><span class="icon">✓</span> <strong>No Video/Audio Download:</strong> Zero downloading, stripping, or modifying of YouTube streams.</li>
              <li><span class="icon">✓</span> <strong>Embedded Playback:</strong> Uses official standard YouTube iframe player with user controls.</li>
              <li><span class="icon">✓</span> <strong>Prominent Disclosures:</strong> Privacy Policy and Terms explicitly link to YouTube TOS and Google Privacy Policy.</li>
            </ul>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>API Feature / Endpoint</th>
                <th>Platform Usage</th>
                <th>Quota Optimization &amp; Policy Adherence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="tag">youtube.search.list</span></td>
                <td>Finds vocational instructional demonstrations matching NSQF competency standards (100% Free Public Access)</td>
                <td>7-Day Ephemeral Cache with automated daily purge routine prevents redundant quota requests (Policy III.E.4.a-g)</td>
              </tr>
              <tr>
                <td><span class="tag">youtube.videos.list</span></td>
                <td>Retrieves video title, channel name, and duration for preview metadata</td>
                <td>Zero storage of private personal user data or viewing history (Policy III.A.2d &amp; III.A.2e)</td>
              </tr>
              <tr>
                <td><span class="tag">Standard IFrame Player</span></td>
                <td>In-browser video playback in Student NSQF Skillpedia portal</td>
                <td>Preserves all YouTube branding, advertising, and channel links without overlays or modification</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
    `;
    await pageSupport.setContent(supportHtml, { waitUntil: 'domcontentloaded' });
    await pageSupport.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 400));

    const supportPng = path.join(outputDir, 'Other_Supporting_Materials_HAYAGRIVA.png');
    const supportPdf = path.join(outputDir, 'Other_Supporting_Materials_HAYAGRIVA.pdf');
    await pageSupport.screenshot({ path: supportPng, fullPage: true });
    await pageSupport.pdf({ path: supportPdf, format: 'A4', landscape: true, printBackground: true });
    console.log(`✅ Supporting Materials saved: PNG + PDF`);

    // -------------------------------------------------------------
    // 4. Combined Multi-page PDF
    // -------------------------------------------------------------
    const combinedPage = await browser.newPage();
    const combinedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Lato:wght@400;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #0B1120; font-family: 'Lato', sans-serif; color: #FFFFFF; }
        .page { width: 100vw; height: 100vh; padding: 25px 35px; page-break-after: always; display: flex; flex-direction: column; justify-content: center; }
        .page:last-child { page-break-after: avoid; }
        .canvas { background: #1E293B; border: 2px solid #334155; border-radius: 16px; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 15px; margin-bottom: 20px; }
        .title { font-family: 'Google Sans', sans-serif; font-size: 24px; font-weight: 700; color: #38BDF8; }
        .subtitle { font-size: 13px; color: #94A3B8; margin-top: 3px; }
        .badge { background: #0284C7; color: #FFF; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        
        /* Grid & items */
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .card { background: #0F172A; border: 1px solid #334155; border-radius: 10px; padding: 16px; }
        .card-header { font-family: 'Google Sans', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .card.frontend .card-header { color: #60A5FA; }
        .card.backend .card-header { color: #34D399; }
        .card.external .card-header { color: #F87171; }
        .item-list { list-style: none; padding: 0; margin: 0; }
        .item-list li { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 8px 10px; margin-bottom: 7px; font-size: 11.5px; line-height: 1.4; }
        .item-list li strong { color: #F1F5F9; }
        
        .api-flow { margin-top: 18px; background: #0F172A; border: 1px dashed #38BDF8; border-radius: 10px; padding: 14px; text-align: center; }
        .api-flow-title { font-family: 'Google Sans', sans-serif; font-size: 14px; font-weight: 700; color: #38BDF8; margin-bottom: 8px; }
        .flow-steps { display: flex; justify-content: space-around; align-items: center; font-size: 11.5px; }
        .flow-step { background: #1E293B; border: 1px solid #475569; padding: 8px 12px; border-radius: 6px; color: #E2E8F0; }
        .flow-arrow { color: #38BDF8; font-size: 18px; font-weight: bold; }
        
        /* Timeline */
        .timeline { display: flex; flex-direction: column; gap: 12px; }
        .step-row { display: flex; align-items: center; gap: 14px; }
        .step-num { width: 36px; height: 36px; border-radius: 50%; background: #0284C7; color: #FFF; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-content { flex: 1; background: #0F172A; border: 1px solid #334155; border-radius: 10px; padding: 12px 18px; }
        .step-title { font-family: 'Google Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: #F1F5F9; margin-bottom: 4px; }
        .step-desc { font-size: 12px; color: #94A3B8; line-height: 1.45; }
        .highlight { color: #38BDF8; font-weight: 600; }
        
        /* Table */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .table-wrap { margin-top: 16px; background: #0F172A; border: 1px solid #334155; border-radius: 10px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 11.5px; text-align: left; }
        th { background: #1E293B; color: #94A3B8; padding: 8px 14px; border-bottom: 1px solid #334155; font-weight: 600; }
        td { padding: 8px 14px; border-bottom: 1px solid #1E293B; color: #E2E8F0; }
        .tag { background: rgba(56,189,248,0.15); color: #38BDF8; padding: 2px 6px; border-radius: 4px; font-family: 'Roboto Mono', monospace; font-size: 10.5px; }
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-list li { font-size: 12px; color: #E2E8F0; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 6px; }
        .bullet-list li span.icon { color: #10B981; font-weight: bold; }
      </style>
    </head>
    <body>
      <!-- Page 1: Architecture -->
      <div class="page">
        <div class="canvas">
          <div class="header">
            <div>
              <div class="title">HAYAGRIVA System Architecture &amp; YouTube API Integration</div>
              <div class="subtitle">Universal Integrated Professional Environment (IPE) &amp; NSQF Skillpedia</div>
            </div>
            <span class="badge" style="background:#0284C7;">Section 1: Architecture</span>
          </div>
          <div class="grid">
            <div class="card frontend">
              <div class="card-header">💻 1. Client Applications</div>
              <ul class="item-list">
                <li><strong>Web Portal (hayagriva.app):</strong> Responsive web interface for Students, Employees &amp; Professionals.</li>
                <li><strong>Desktop IPE:</strong> Local-first air-gapped environment with local encrypted vaults (.vlt).</li>
                <li><strong>Standard YouTube Embed Player:</strong> Official iframe player with strict compliance to Google policies.</li>
              </ul>
            </div>
            <div class="card backend">
              <div class="card-header">⚙️ 2. Core Backend &amp; Data Engine</div>
              <ul class="item-list">
                <li><strong>Express API Gateway:</strong> Stateless micro-service router for public educational search.</li>
                <li><strong>NSQF 5-Table Database:</strong> Curated taxonomy of 2,176 NCVET Job Roles &amp; 207,000 criteria.</li>
                <li><strong>7-Day Ephemeral Cache:</strong> Short-term operational cache (7-day TTL auto-purge) to prevent rate limits.</li>
                <li><strong>AI Quality Evaluator:</strong> Validates video title relevancy against vocational criteria.</li>
              </ul>
            </div>
            <div class="card external">
              <div class="card-header">🌐 3. Third-Party Integrations &amp; Open Standards</div>
              <ul class="item-list">
                <li><strong>YouTube Data API v3:</strong> Official search.list endpoint for 100% free educational demonstrations.</li>
                <li><strong>NCVET National Framework:</strong> Open Government Data (OGD) vocational curriculum standards.</li>
                <li><strong>Sarvam AI:</strong> Contextual intent &amp; search query synthesis.</li>
              </ul>
            </div>
          </div>
          <div class="api-flow">
            <div class="api-flow-title">🔄 Read-Only YouTube API Educational Retrieval Flow (100% Free Public Access)</div>
            <div class="flow-steps">
              <div class="flow-step">1. User selects NSQF Job Role</div>
              <div class="flow-arrow">➔</div>
              <div class="flow-step">2. Backend checks 7-Day Ephemeral Cache</div>
              <div class="flow-arrow">➔</div>
              <div class="flow-step">3. YouTube Data API (search.list)</div>
              <div class="flow-arrow">➔</div>
              <div class="flow-step">4. Client renders standard iframe player</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Page 2: User Flow -->
      <div class="page">
        <div class="canvas">
          <div class="header">
            <div>
              <div class="title">HAYAGRIVA Student &amp; Vocational Learner User Flow</div>
              <div class="subtitle">End-to-End Educational Micro-Learning Journey with YouTube API</div>
            </div>
            <span class="badge" style="background:#059669;">Section 2: User Flow</span>
          </div>
          <div class="timeline">
            <div class="step-row">
              <div class="step-num">1</div>
              <div class="step-content">
                <div class="step-title">Role &amp; Sector Discovery</div>
                <div class="step-desc">Student browses 41 national sectors and chooses a targeted Qualification Pack (e.g. <span class="highlight">AGR/Q0101 Paddy Cultivator</span>).</div>
              </div>
            </div>
            <div class="step-row">
              <div class="step-num">2</div>
              <div class="step-content">
                <div class="step-title">Curriculum &amp; 11-Step Reel Breakdown</div>
                <div class="step-desc">The platform loads the official NSQF National Occupational Standards (NOS) and displays the interactive 11-chapter micro-learning curriculum with step-by-step competency goals.</div>
              </div>
            </div>
            <div class="step-row">
              <div class="step-num">3</div>
              <div class="step-content">
                <div class="step-title">Practical Demonstration Retrieval (YouTube Data API v3)</div>
                <div class="step-desc">System retrieves highly relevant instructional video tutorials via <span class="highlight">YouTube Data API v3 (search.list)</span>, validated by AI for 90%+ vocational accuracy. 7-Day caching prevents redundant API calls.</div>
              </div>
            </div>
            <div class="step-row">
              <div class="step-num">4</div>
              <div class="step-content">
                <div class="step-title">In-Platform Video Learning &amp; Progress Tracking</div>
                <div class="step-desc">The student watches the demonstration using the <span class="highlight">standard YouTube iframe player</span>, completes performance criteria checklist items, and tracks skill mastery (100% Free, No Paywalls).</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Page 3: Supporting Materials -->
      <div class="page">
        <div class="canvas">
          <div class="header">
            <div>
              <div class="title">HAYAGRIVA Platform Overview &amp; YouTube API Compliance</div>
              <div class="subtitle">Educational Vocational Enablement for 2,176 NSQF National Qualifications</div>
            </div>
            <span class="badge" style="background:#7C3AED;">Section 3: Supporting Info</span>
          </div>
          <div class="grid-2">
            <div class="card">
              <div class="card-title">📖 Project Purpose &amp; Value Proposition</div>
              <div class="text">
                <p>HAYAGRIVA is an Indian National Qualification Framework (NSQF) educational platform designed to empower students and vocational candidates across 41 sectors.</p>
                <p>The platform aggregates structured government curriculum standards (2,176 Job Roles, 207,000 performance criteria) and pairs them with high-quality practical demonstration videos retrieved dynamically via YouTube Data API v3.</p>
              </div>
            </div>
            <div class="card">
              <div class="card-title">🛡️ Data Governance &amp; Policy Adherence</div>
              <ul class="bullet-list">
                <li><span class="icon">✓</span> <strong>Read-Only API Access:</strong> Only queries <code class="tag">search.list</code> and <code class="tag">videos.list</code>.</li>
                <li><span class="icon">✓</span> <strong>100% Free Public Access:</strong> Zero paywalls, zero monetization of video content.</li>
                <li><span class="icon">✓</span> <strong>7-Day Ephemeral Cache:</strong> Automated daily purge of stale metadata (Policy III.E.4.a-g).</li>
                <li><span class="icon">✓</span> <strong>No Video/Audio Download:</strong> Zero downloading or modifying of streams.</li>
                <li><span class="icon">✓</span> <strong>Embedded Playback:</strong> Standard iframe player with user controls.</li>
                <li><span class="icon">✓</span> <strong>Attribution:</strong> Direct links to YouTube TOS &amp; Google Privacy Policy.</li>
              </ul>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>API Endpoint</th>
                  <th>Platform Usage</th>
                  <th>Compliance &amp; Optimization</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="tag">youtube.search.list</span></td>
                  <td>Finds instructional video demonstrations matching NSQF competency standards (100% Free)</td>
                  <td>7-Day Ephemeral Cache with daily purge prevents duplicate queries (Policy III.E.4.a-g)</td>
                </tr>
                <tr>
                  <td><span class="tag">youtube.videos.list</span></td>
                  <td>Retrieves video title, channel name, and duration for preview metadata</td>
                  <td>Zero storage of private personal user data or viewing history (Policy III.A.2d &amp; III.A.2e)</td>
                </tr>
                <tr>
                  <td><span class="tag">Standard IFrame Player</span></td>
                  <td>In-browser video playback in Student NSQF Skillpedia portal</td>
                  <td>Preserves all YouTube branding, advertising, and channel links without overlays</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    await combinedPage.setContent(combinedHtml, { waitUntil: 'domcontentloaded' });
    await combinedPage.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 400));

    const combinedPdf = path.join(outputDir, 'HAYAGRIVA_Design_Documents_Complete_Bundle.pdf');
    await combinedPage.pdf({ path: combinedPdf, format: 'A4', landscape: true, printBackground: true });
    console.log(`✅ Complete 3-page Document Bundle saved: ${combinedPdf}`);

    await browser.close();
}

generateAll().catch(err => {
    console.error('Error generating materials:', err);
    process.exit(1);
});
