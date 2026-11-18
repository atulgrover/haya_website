'use strict';

/**
 * 🎨 Design & Architecture Diagram Generator for YouTube API Review
 * Generates high-res Architecture Diagram and User Flow Diagram PNGs.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const outputDir = path.join('/Users/atulgrover/Desktop', 'YouTube_API_Evidence');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function generateDiagrams() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });

    // 1. Architecture Diagram HTML
    const archHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto+Mono:wght@400;500&family=Lato:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 40px; background: #0F172A; font-family: 'Lato', sans-serif; color: #FFFFFF; }
        .canvas { background: #1E293B; border: 2px solid #334155; border-radius: 20px; padding: 40px; max-width: 1300px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 35px; }
        .title { font-family: 'Google Sans', sans-serif; font-size: 28px; font-weight: 700; color: #38BDF8; }
        .badge { background: #0284C7; color: #FFF; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .card { background: #0F172A; border: 1px solid #334155; border-radius: 14px; padding: 24px; }
        .card-header { font-family: 'Google Sans', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
        .card.frontend .card-header { color: #60A5FA; }
        .card.backend .card-header { color: #34D399; }
        .card.external .card-header { color: #F87171; }
        .item-list { list-style: none; padding: 0; margin: 0; }
        .item-list li { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; font-size: 13.5px; }
        .item-list li strong { color: #F1F5F9; }
        
        .api-flow { margin-top: 30px; background: #0F172A; border: 1px dashed #38BDF8; border-radius: 14px; padding: 20px; text-align: center; }
        .api-flow-title { font-family: 'Google Sans', sans-serif; font-size: 16px; font-weight: 700; color: #38BDF8; margin-bottom: 10px; }
        .flow-steps { display: flex; justify-content: space-around; align-items: center; font-size: 13px; }
        .flow-step { background: #1E293B; border: 1px solid #475569; padding: 10px 16px; border-radius: 8px; color: #E2E8F0; }
        .flow-arrow { color: #38BDF8; font-size: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="canvas">
        <div class="header">
          <div>
            <div class="title">HAYAGRIVA System Architecture &amp; YouTube API Integration</div>
            <div style="font-size: 14px; color: #94A3B8; margin-top: 4px;">Universal Integrated Professional Environment (IPE) &amp; NSQF Skillpedia</div>
          </div>
          <span class="badge">Google Cloud Quota Review</span>
        </div>

        <div class="grid">
          <!-- 1. Client Layer -->
          <div class="card frontend">
            <div class="card-header">💻 1. Client Applications</div>
            <ul class="item-list">
              <li><strong>Web Portal (hayagriva.app):</strong> Responsive web interface for Students, Employees &amp; Professionals.</li>
              <li><strong>Desktop IPE:</strong> Local-first air-gapped environment with local encrypted vaults (.vlt).</li>
              <li><strong>Standard YouTube Embed Player:</strong> Uses official iframe player with strict compliance to Google/YouTube policies.</li>
            </ul>
          </div>

          <!-- 2. Core Backend Layer -->
          <div class="card backend">
            <div class="card-header">⚙️ 2. Core Backend &amp; Data Engine</div>
            <ul class="item-list">
              <li><strong>Express API Gateway:</strong> Stateless micro-service router with JWT authentication.</li>
              <li><strong>NSQF 5-Table Database:</strong> Curated taxonomy of 2,176 NCVET Job Roles &amp; 207,000 criteria.</li>
              <li><strong>Search Cache (youtube_search_cache):</strong> Permanent caching to prevent duplicate API calls.</li>
              <li><strong>AI Quality Evaluator:</strong> Validates video title relevancy against vocational criteria.</li>
            </ul>
          </div>

          <!-- 3. Third-Party Integrations -->
          <div class="card external">
            <div class="card-header">🌐 3. Third-Party Services</div>
            <ul class="item-list">
              <li><strong>YouTube Data API v3:</strong> Read-only search.list and videos.list endpoints for educational reels.</li>
              <li><strong>Razorpay PCI-DSS Gateway:</strong> Secure tokenized payment processing (zero card storage).</li>
              <li><strong>Sarvam AI / OpenRouter:</strong> Contextual intent &amp; search query synthesis.</li>
            </ul>
          </div>
        </div>

        <div class="api-flow">
          <div class="api-flow-title">🔄 Read-Only YouTube API Educational Retrieval Flow</div>
          <div class="flow-steps">
            <div class="flow-step">1. User selects NSQF Job Role (e.g. Paddy Cultivator)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">2. Backend queries Search Cache</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">3. YouTube Data API (search.list) for new criteria</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">4. Client renders standard YouTube iframe player</div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(archHtml, { waitUntil: 'domcontentloaded' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 400));
    const archPath = path.join(outputDir, 'Architecture_Diagram_HAYAGRIVA.png');
    await page.screenshot({ path: archPath, fullPage: true });
    console.log(`✅ Architecture Diagram saved: ${archPath}`);

    // 2. User Flow Diagram HTML
    const flowPage = await browser.newPage();
    await flowPage.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
    const flowHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 40px; background: #0F172A; font-family: 'Lato', sans-serif; color: #FFFFFF; }
        .canvas { background: #1E293B; border: 2px solid #334155; border-radius: 20px; padding: 40px; max-width: 1300px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 35px; }
        .title { font-family: 'Google Sans', sans-serif; font-size: 28px; font-weight: 700; color: #38BDF8; }
        .badge { background: #059669; color: #FFF; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .timeline { display: flex; flex-direction: column; gap: 20px; }
        .step-row { display: flex; align-items: center; gap: 20px; }
        .step-num { width: 44px; height: 44px; border-radius: 50%; background: #0284C7; color: #FFF; font-weight: 700; font-size: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-content { flex: 1; background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 18px 24px; }
        .step-title { font-family: 'Google Sans', sans-serif; font-size: 16px; font-weight: 700; color: #F1F5F9; margin-bottom: 6px; }
        .step-desc { font-size: 13.5px; color: #94A3B8; line-height: 1.5; }
        .highlight { color: #38BDF8; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="canvas">
        <div class="header">
          <div>
            <div class="title">HAYAGRIVA Student &amp; Vocational Learner User Flow</div>
            <div style="font-size: 14px; color: #94A3B8; margin-top: 4px;">End-to-End Educational Micro-Learning Experience with YouTube API</div>
          </div>
          <span class="badge">User Journey Map</span>
        </div>

        <div class="timeline">
          <div class="step-row">
            <div class="step-num">1</div>
            <div class="step-content">
              <div class="step-title">Role &amp; Sector Discovery</div>
              <div class="step-desc">Student browses 41 national sectors (Agriculture, Automotive, Electronics, Healthcare, etc.) and chooses a targeted Qualification Pack (e.g. <span class="highlight">AGR/Q0101 Paddy Cultivator</span>).</div>
            </div>
          </div>

          <div class="step-row">
            <div class="step-num">2</div>
            <div class="step-content">
              <div class="step-title">Curriculum &amp; 11-Step Reel Breakdown</div>
              <div class="step-desc">The platform loads the official NSQF National Occupational Standards (NOS) and displays the interactive 11-chapter micro-learning curriculum with competency goals.</div>
            </div>
          </div>

          <div class="step-row">
            <div class="step-num">3</div>
            <div class="step-content">
              <div class="step-title">Practical Demonstration Retrieval (YouTube API)</div>
              <div class="step-desc">System retrieves highly relevant, verified instructional video tutorials via <span class="highlight">YouTube Data API v3 (search.list)</span>, validated by AI for 90%+ vocational accuracy.</div>
            </div>
          </div>

          <div class="step-row">
            <div class="step-num">4</div>
            <div class="step-content">
              <div class="step-title">In-Platform Video Learning &amp; Progress Tracking</div>
              <div class="step-desc">The student watches the demonstration using the <span class="highlight">standard YouTube iframe player</span>, completes performance criteria checklist items, and tracks skill progress.</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    await flowPage.setContent(flowHtml, { waitUntil: 'domcontentloaded' });
    await flowPage.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 400));
    const flowPath = path.join(outputDir, 'User_Flow_Diagram_HAYAGRIVA.png');
    await flowPage.screenshot({ path: flowPath, fullPage: true });
    console.log(`✅ User Flow Diagram saved: ${flowPath}`);

    await browser.close();
}

generateDiagrams().catch(console.error);
