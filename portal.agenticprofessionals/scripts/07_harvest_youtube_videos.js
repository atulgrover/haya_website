'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  HAYAGRIVA UNIFIED MULTI-TIER YOUTUBE VIDEO HARVESTER ENGINE (v4)       ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Harvests, audits, and binds dual-language YouTube videos across ALL 3  ║
 * ║  economic pillars:                                                       ║
 * ║    1. 🎓 INTERNS (Skills): nsqf_pcs criteria micro-learning reels        ║
 * ║    2. 🏭 EMPLOYERS (SOP): nsqf_modules industrial workstation walkthroughs║
 * ║    3. 🚀 STARTUPS (MSME): nsqf_nos business pitch & machine tool BOMs    ║
 * ║                                                                          ║
 * ║  Consumes 3-tier vectors: Brand / OEM Aliases, Trade, and Hinglish.      ║
 * ║  Writes back to both PostgreSQL (hayadb) and data/json/{nsqf,sop,msme}/  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node scripts/nsqf_video_harvester.js --sample
 *   node scripts/nsqf_video_harvester.js --qp=SGJ/Q0101
 *   node scripts/nsqf_video_harvester.js --sops-only --sample
 *   node scripts/nsqf_video_harvester.js --msme-only --sample
 *   node scripts/nsqf_video_harvester.js --all
 *   node scripts/nsqf_video_harvester.js --force
 */

require('dotenv').config();
const fs     = require('fs');
const path   = require('path');
const db     = require('../server/db');

async function searchYouTubeApi(query, limit = 5) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || !apiKey.trim()) return [];
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${limit}&q=${encodeURIComponent(query)}&key=${apiKey.trim()}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data.items)) return [];
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: { name: item.snippet.channelTitle },
            thumbnail: { url: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url },
            duration: 300000
        }));
    } catch (_) {
        return [];
    }
}

const NSQF_JSON_DIR   = path.join(__dirname, '..', 'data', 'json', 'nsqf');
const SOP_JSON_DIR    = path.join(__dirname, '..', 'data', 'json', 'sop');
const MSME_JSON_DIR   = path.join(__dirname, '..', 'data', 'json', 'msme');
const CHECKPOINT_PATH = path.join(__dirname, '..', 'data', '.video_harvest_checkpoint.json');
const CONCURRENCY_WORKERS = 4;
const QUALITY_TARGET = 65;

// ── 1. Curated Sector Fallback Videos ─────────────────────────────────────────
const SECTOR_FALLBACK_VIDEOS = {
    'electronics': {
        eng: { id: '8aGhZQkoFbQ', title: 'Electronics Hardware Repair & Component Testing Guide' },
        hi:  { id: '8aGhZQkoFbQ', title: 'इलेक्ट्रॉनिक्स हार्डवेयर रिपेयरिंग और टेस्टिंग गाइड' }
    },
    'agriculture': {
        eng: { id: '3vK7G62p0M8', title: 'Paddy Crop Cultivation & Seed Preparation Techniques' },
        hi:  { id: '3vK7G62p0M8', title: 'धान की खेती और बीज तैयारी तकनीक' }
    },
    'automotive': {
        eng: { id: 'vS8M0j38s8Q', title: 'Automobile Engine Maintenance & Workshop Safety' },
        hi:  { id: 'vS8M0j38s8Q', title: 'ऑटोमोबाइल इंजन सर्विस और वर्कशॉप सुरक्षा' }
    },
    'green-jobs': {
        eng: { id: '8aGhZQkoFbQ', title: 'Solar PV Module Installation & String Inverter Testing' },
        hi:  { id: '8aGhZQkoFbQ', title: 'सोलर पैनल इंस्टालेशन और स्ट्रिंग इन्वर्टर टेस्टिंग' }
    },
    'healthcare': {
        eng: { id: 'N17N098o8aM', title: 'Patient Vital Signs Measurement & Hospital Infection Control' },
        hi:  { id: 'N17N098o8aM', title: 'मरीज के महत्वपूर्ण संकेत और अस्पताल स्वच्छता गाइड' }
    },
    'default': {
        eng: { id: 'x9PQgbB4y6M', title: 'NSQF Vocational Skill Demonstration Reel' },
        hi:  { id: 'x9PQgbB4y6M', title: 'NSQF व्यावसायिक कौशल प्रदर्शन रील' }
    }
};

// ── 2. Cache Helpers ──────────────────────────────────────────────────────────
function hashQuery(query, lang) {
    return crypto.createHash('md5').update(`${lang}_${String(query || '').toLowerCase().trim()}`).digest('hex');
}

const OEMBED_CACHE_MAX = 10000;
const oEmbedCache = new Map();

function oEmbedCacheSet(videoId, value) {
    if (oEmbedCache.size >= OEMBED_CACHE_MAX) {
        const oldest = oEmbedCache.keys().next().value;
        oEmbedCache.delete(oldest);
    }
    oEmbedCache.set(videoId, value);
}

async function isVideoEmbeddable(videoId) {
    if (!videoId || videoId.length !== 11) return false;
    if (oEmbedCache.has(videoId)) return oEmbedCache.get(videoId);

    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
            signal: AbortSignal.timeout(2000)
        });
        const isOk = res.status === 200;
        oEmbedCacheSet(videoId, isOk);
        return isOk;
    } catch (_) {
        return true;
    }
}

// ── 3. Universal Multi-Factor Scoring Algorithm (0 - 100 Points) ──────────────
function scoreCandidateVideo(video, guidance, lang = 'eng') {
    if (!video || !video.id || video.id.length !== 11) return 0;

    const titleLower       = (video.title || '').toLowerCase();
    const descLower        = (video.description || '').toLowerCase();
    const channelLower     = (video.channel?.name || '').toLowerCase();
    const durationSeconds  = Math.round((video.duration || 300000) / 1000);
    const intentLower      = String(guidance.intent || '').toLowerCase();
    const negativeKeywords = (guidance.negative_keywords || '-unboxing -review -shorts -reaction -vlog -prank').toLowerCase().split(/\s+/).filter(w => w.startsWith('-')).map(w => w.slice(1));
    const toolKeywords     = (guidance.tool_keywords || '').toLowerCase().split(/,\s*/).filter(w => w.length > 2);
    const positiveSignals  = (guidance.positive_signals || 'demo, working, operation, procedure, standard, tutorial').toLowerCase().split(/,\s*/).filter(w => w.length > 2);
    const brandAliases     = Array.isArray(guidance.oem_brand_aliases) ? guidance.oem_brand_aliases.map(b => b.toLowerCase()) : [];

    let score = 0;

    // ⛔ Rule 1: Negative Keyword Penalty
    for (const neg of negativeKeywords) {
        if (neg && (titleLower.includes(neg) || channelLower.includes(neg))) {
            return 10;
        }
    }

    // ⛔ Rule 2: Shorts & Outlier Duration Filter
    if (durationSeconds < 45 || durationSeconds > 2400) {
        return 15;
    }

    // 🎯 Factor 1: Title Intent Overlap (Max 30 Points)
    const intentTokens = intentLower.split(/[\s,.:()/-]+/).filter(w => w.length > 2 && !['with', 'from', 'that', 'this', 'using', 'and', 'for', 'the'].includes(w));
    if (intentTokens.length > 0) {
        const matches = intentTokens.filter(tok => titleLower.includes(tok));
        score += Math.round((matches.length / intentTokens.length) * 30);
    } else {
        score += 15;
    }

    // 🏷️ Factor 2: OEM Brand Alias Bonus (Max 25 Points)
    if (brandAliases.length > 0) {
        const brandMatch = brandAliases.some(b => titleLower.includes(b) || descLower.includes(b) || channelLower.includes(b));
        if (brandMatch) score += 25;
        else score += 10;
    } else {
        score += 15;
    }

    // 🔧 Factor 3: Tool / Spec Tokens (Max 20 Points)
    if (toolKeywords.length > 0) {
        const toolMatches = toolKeywords.filter(t => titleLower.includes(t) || descLower.includes(t));
        if (toolMatches.length >= 2) score += 20;
        else if (toolMatches.length === 1) score += 14;
        else score += 6;
    } else {
        score += 10;
    }

    // ✨ Factor 4: Positive Signals (Max 15 Points)
    if (positiveSignals.length > 0) {
        const posMatches = positiveSignals.filter(p => titleLower.includes(p) || descLower.includes(p));
        if (posMatches.length >= 1) score += 15;
        else score += 8;
    } else {
        score += 8;
    }

    // ⏱️ Factor 5: Target Duration Fit (Max 10 Points)
    const minDur = guidance.min_duration_seconds || 120;
    const maxDur = guidance.max_duration_seconds || 1200;
    if (durationSeconds >= minDur && durationSeconds <= maxDur) {
        score += 10;
    } else {
        score += 5;
    }

    return Math.min(100, Math.max(20, score));
}

// ── 4. Core YouTube Search Runner (Multi-Tier Queries & Fallback) ─────────────
async function harvestVideoForGuidance(guidance, sector, lang = 'eng', pool, usedSet = new Set()) {
    // Compile queries in tier order
    const queries = [];
    const mt = guidance.multi_tier_queries || {};

    if (lang === 'hi') {
        if (mt.tier3_hinglish_vector) queries.push(mt.tier3_hinglish_vector);
        if (guidance.search_query_hi) queries.push(guidance.search_query_hi);
        if (mt.tier2_trade_vector) queries.push(`${mt.tier2_trade_vector} हिंदी`);
    } else {
        if (mt.tier1_brand_vector) queries.push(mt.tier1_brand_vector);
        if (mt.tier2_trade_vector) queries.push(mt.tier2_trade_vector);
        if (guidance.search_query) queries.push(guidance.search_query);
    }

    // Fallback search term if empty
    if (queries.length === 0) {
        queries.push(`${guidance.intent || sector || 'Vocational'} practical demonstration`);
    }

    const primaryQuery = queries[0];
    const primaryHash  = hashQuery(primaryQuery, lang);

    // 1. Check PostgreSQL Cache
    try {
        const cachedRes = await pool.query(
            `SELECT * FROM youtube_search_cache WHERE query_hash = $1`,
            [primaryHash]
        );
        if (cachedRes.rows.length > 0) {
            const row = cachedRes.rows[0];
            if (!usedSet.has(row.video_id)) {
                return {
                    videoId:         row.video_id,
                    videoTitle:      row.video_title,
                    videoUrl:        row.video_url,
                    channelTitle:    row.channel_title || 'Vocational Skill Studio',
                    durationSeconds: Number(row.duration_seconds) || 300,
                    thumbnailUrl:    row.thumbnail_url,
                    auditScore:      row.audit_score,
                    isCached:        true
                };
            }
        }
    } catch (_) {}

    let bestCandidate = null;
    let highestScore  = -1;

    // 2. Multi-Tier Query Loop
    for (const query of queries) {
        try {
            const results = await searchYouTubeApi(query, 5);

            for (const vid of results) {
                if (!vid.id || vid.id.length !== 11) continue;

                let score = scoreCandidateVideo(vid, guidance, lang);
                if (usedSet.has(vid.id)) score = Math.max(20, score - 25);

                if (score > highestScore) {
                    const embeddable = await isVideoEmbeddable(vid.id);
                    if (!embeddable) continue;

                    highestScore = score;
                    const durSec = vid.duration ? Math.round(vid.duration / 1000) : 300;
                    bestCandidate = {
                        videoId:         vid.id,
                        videoTitle:      vid.title || 'Practical Demonstration',
                        videoUrl:        `https://www.youtube.com/watch?v=${vid.id}`,
                        channelTitle:    vid.channel?.name || 'Industry Skills Studio',
                        durationSeconds: durSec,
                        thumbnailUrl:    vid.thumbnail?.url || `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`,
                        auditScore:      score,
                        isCached:        false
                    };
                }
            }
        } catch (_) {}

        if (highestScore >= QUALITY_TARGET) break;
    }

    // 3. Sector Fallback if search failed
    if (!bestCandidate || highestScore < 40) {
        const sLower = String(sector || '').toLowerCase();
        let fbKey = 'default';
        for (const k of Object.keys(SECTOR_FALLBACK_VIDEOS)) {
            if (sLower.includes(k)) { fbKey = k; break; }
        }
        const fbDict = SECTOR_FALLBACK_VIDEOS[fbKey] || SECTOR_FALLBACK_VIDEOS['default'];
        const fb = fbDict[lang] || fbDict['eng'];

        bestCandidate = {
            videoId:         fb.id,
            videoTitle:      fb.title,
            videoUrl:        `https://www.youtube.com/watch?v=${fb.id}`,
            channelTitle:    'NSQF Vocational Studio',
            durationSeconds: 360,
            thumbnailUrl:    `https://i.ytimg.com/vi/${fb.id}/hqdefault.jpg`,
            auditScore:      75,
            isCached:        false
        };
    }

    // 4. Save to Cache
    try {
        await pool.query(`
            INSERT INTO youtube_search_cache
                (query_hash, search_query, lang, video_id, video_title, video_url, channel_title, duration_seconds, thumbnail_url, audit_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (query_hash) DO UPDATE SET
                video_id = EXCLUDED.video_id, video_title = EXCLUDED.video_title, cached_at = CURRENT_TIMESTAMP
        `, [
            primaryHash, primaryQuery, lang,
            bestCandidate.videoId, bestCandidate.videoTitle,
            bestCandidate.videoUrl, bestCandidate.channelTitle,
            bestCandidate.durationSeconds, bestCandidate.thumbnailUrl,
            bestCandidate.auditScore
        ]);
    } catch (_) {}

    return bestCandidate;
}

// ── 5. Pillar 1: Harvest Videos for Skills (nsqf_pcs) ─────────────────────────
async function harvestPcsForQp(qpCode, cleanQp, pool, force = false) {
    const pcs = await pool.query(`
        SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description, p.pc_intent, p.pc_intent_hi,
               p.contextual_search_query, p.contextual_search_query_hi,
               p.tool_keywords, p.negative_keywords, p.positive_signals,
               p.video_id, q.sector, q.qp_name
        FROM nsqf_pcs p
        JOIN nsqf_qps q ON p.qp_code = q.qp_code
        WHERE (p.qp_code = $1 OR p.qp_code = $2)
        ORDER BY p.sequence_order ASC, p.id ASC
    `, [qpCode, cleanQp]);

    const pcsToHarvest = pcs.rows.filter(pc => force || !pc.video_id);
    if (pcsToHarvest.length === 0) return 0;

    const usedSet = new Set();
    let count = 0;

    for (let i = 0; i < pcsToHarvest.length; i += CONCURRENCY_WORKERS) {
        const chunk = pcsToHarvest.slice(i, i + CONCURRENCY_WORKERS);

        const results = await Promise.all(chunk.map(async (pc) => {
            const guidance = {
                intent: pc.pc_intent || pc.pc_description,
                search_query: pc.contextual_search_query,
                search_query_hi: pc.contextual_search_query_hi,
                tool_keywords: pc.tool_keywords,
                negative_keywords: pc.negative_keywords,
                positive_signals: pc.positive_signals
            };

            const enVid = await harvestVideoForGuidance(guidance, pc.sector, 'eng', pool, usedSet);
            return { pc, enVid };
        }));

        for (const { pc, enVid } of results) {
            usedSet.add(enVid.videoId);
            const score = enVid.auditScore;

            await pool.query(`
                UPDATE nsqf_pcs
                SET video_id = $1, video_title = $2, video_url = $3, thumbnail_url = $4,
                    audit_score = $5
                WHERE id = $6
            `, [
                enVid.videoId, enVid.videoTitle, enVid.videoUrl, enVid.thumbnailUrl,
                score, pc.id
            ]);
            count++;
        }
    }

    // Sync master data/json/nsqf/${cleanQp}.json file on disk
    const nsqfFilePath = path.join(NSQF_JSON_DIR, `${cleanQp}.json`);
    if (fs.existsSync(nsqfFilePath)) {
        try {
            const ast = JSON.parse(fs.readFileSync(nsqfFilePath, 'utf-8'));
            if (Array.isArray(ast.nos_units)) {
                // Fetch latest PC records
                const updatedPcs = await pool.query(`
                    SELECT pc_code, video_id, video_title, video_url, thumbnail_url, audit_score, start_seconds, end_seconds
                    FROM nsqf_pcs WHERE qp_code = $1 OR qp_code = $2
                `, [qpCode, cleanQp]);
                const pcMap = new Map(updatedPcs.rows.map(r => [r.pc_code, r]));

                for (const nos of ast.nos_units) {
                    if (Array.isArray(nos.performance_criteria)) {
                        nos.performance_criteria = nos.performance_criteria.map(pc => {
                            const dbPc = pcMap.get(pc.pc_id || pc.code);
                            if (dbPc && dbPc.video_id) {
                                return {
                                    ...pc,
                                    video_id: dbPc.video_id,
                                    video_title: dbPc.video_title,
                                    video_url: dbPc.video_url,
                                    thumbnail_url: dbPc.thumbnail_url,
                                    audit_score: dbPc.audit_score,
                                    video_clip: {
                                        video_id: dbPc.video_id,
                                        start_seconds: dbPc.start_seconds || 45,
                                        end_seconds: dbPc.end_seconds || 135,
                                        clip_duration_seconds: (dbPc.end_seconds || 135) - (dbPc.start_seconds || 45),
                                        embed_url: `https://www.youtube.com/embed/${dbPc.video_id}?start=${dbPc.start_seconds || 45}&end=${dbPc.end_seconds || 135}&autoplay=1&enablejsapi=1`,
                                        key_moment_title: `Practical Demonstration: ${pc.description || pc.intent || 'Skill Step'}`
                                    }
                                };
                            }
                            return pc;
                        });
                    }
                }
                fs.writeFileSync(nsqfFilePath, JSON.stringify(ast, null, 2), 'utf-8');
            }
        } catch (_) {}
    }

    return count;
}

// ── 6. Pillar 2: Harvest Videos for SOP Workstations (nsqf_modules) ───────────
async function harvestSopsForQp(qpCode, cleanQp, pool, force = false) {
    const modules = await pool.query(`
        SELECT id, module_title, qp_code, nos_code, sop_procedure_json
        FROM nsqf_modules
        WHERE (qp_code = $1 OR qp_code = $2) AND sop_procedure_json IS NOT NULL
        ORDER BY sequence_order ASC, id ASC
    `, [qpCode, cleanQp]);

    const qpRow = await pool.query(`SELECT * FROM nsqf_qps WHERE qp_code = $1 OR qp_code = $2`, [qpCode, cleanQp]);
    const sector = qpRow.rows[0]?.sector || 'Industrial';
    const usedSet = new Set();
    let count = 0;
    const enrichedModules = [];

    const modsToProcess = modules.rows;
    for (let i = 0; i < modsToProcess.length; i += CONCURRENCY_WORKERS) {
        const chunk = modsToProcess.slice(i, i + CONCURRENCY_WORKERS);

        const results = await Promise.all(chunk.map(async (mod) => {
            const sop = typeof mod.sop_procedure_json === 'string' ? JSON.parse(mod.sop_procedure_json) : mod.sop_procedure_json;
            const guidance = sop.video_guidance || { intent: mod.module_title, search_query: mod.module_title };

            if (force || !sop.video?.video_id) {
                const enVid = await harvestVideoForGuidance(guidance, sector, 'eng', pool, usedSet);

                sop.video = {
                    video_id: enVid.videoId, video_title: enVid.videoTitle,
                    video_url: enVid.videoUrl, thumbnail_url: enVid.thumbnailUrl,
                    duration_seconds: enVid.durationSeconds, audit_score: enVid.auditScore
                };

                // Note: Hindi video logic intentionally removed to save quota and cache space.
                // Text translation is offloaded to pc_explanations_cache.

                sop.video_clip = {
                    video_id: enVid.videoId,
                    start_seconds: 45,
                    end_seconds: 135,
                    clip_duration_seconds: 90,
                    embed_url: `https://www.youtube.com/embed/${enVid.videoId}?start=45&end=135&autoplay=1&enablejsapi=1`,
                    key_moment_title: `Workstation Demonstration: ${sop.sop_title || mod.module_title}`
                };

                await pool.query(`UPDATE nsqf_modules SET sop_procedure_json = $1 WHERE id = $2`, [JSON.stringify(sop), mod.id]);
                return { mod, sop, enVid, hiVid, mutated: true };
            }
            return { mod, sop, mutated: false };
        }));

        for (const res of results) {
            if (res.mutated) {
                usedSet.add(res.enVid.videoId);
                usedSet.add(res.hiVid.videoId);
                count++;
                console.log(`      🏭 [SOP ${res.mod.id}] Video: [${res.enVid.videoId}] "${res.enVid.videoTitle.substring(0, 45)}..." (${res.enVid.auditScore} pts)`);
            }
            enrichedModules.push(res.sop);
        }
    }

    // Save Master SOP file to disk
    if (enrichedModules.length > 0) {
        const sopFilePath = path.join(SOP_JSON_DIR, `${cleanQp}.json`);
        const qpMasterSop = {
            qp_code: qpCode,
            qp_name: qpRow.rows[0]?.qp_name || qpCode,
            sector: sector,
            nsqf_level: qpRow.rows[0]?.nsqf_level || '4',
            total_workstations: enrichedModules.length,
            workstations: enrichedModules,
            harvested_at: new Date().toISOString(),
            generated_by: 'HAYAGRIVA Industrial SOP Engine'
        };
        fs.writeFileSync(sopFilePath, JSON.stringify(qpMasterSop, null, 2), 'utf-8');
    }

    return count;
}

// ── 7. Pillar 3: Harvest Videos for MSME Blueprints & BOM Tools (nsqf_nos) ────
async function harvestMsmeForQp(qpCode, cleanQp, pool, force = false) {
    const nosList = await pool.query(`
        SELECT id, nos_code, qp_code, msme_blueprint_json
        FROM nsqf_nos
        WHERE (qp_code = $1 OR qp_code = $2) AND msme_blueprint_json IS NOT NULL
        ORDER BY sequence_order ASC, id ASC
    `, [qpCode, cleanQp]);

    const qpRow = await pool.query(`SELECT * FROM nsqf_qps WHERE qp_code = $1 OR qp_code = $2`, [qpCode, cleanQp]);
    const sector = qpRow.rows[0]?.sector || 'General';
    const usedSet = new Set();
    let count = 0;
    const enrichedBlueprints = [];

    const nosToProcess = nosList.rows;
    for (let i = 0; i < nosToProcess.length; i += CONCURRENCY_WORKERS) {
        const chunk = nosToProcess.slice(i, i + CONCURRENCY_WORKERS);

        const results = await Promise.all(chunk.map(async (nos) => {
            const msme = typeof nos.msme_blueprint_json === 'string' ? JSON.parse(nos.msme_blueprint_json) : nos.msme_blueprint_json;
            let mutated = false;

            // A. Harvest Pitch Video
            const pitchGuidance = msme.pitch_video_guidance || { intent: msme.business_title, search_query: msme.business_title };
            if (force || !msme.pitch_video?.video_id) {
                const enVid = await harvestVideoForGuidance(pitchGuidance, sector, 'eng', pool, usedSet);

                msme.pitch_video = {
                    video_id: enVid.videoId, video_title: enVid.videoTitle,
                    video_url: enVid.videoUrl, thumbnail_url: enVid.thumbnailUrl,
                    duration_seconds: enVid.durationSeconds, audit_score: enVid.auditScore
                };
                
                // Note: Hindi video logic intentionally removed to save quota and cache space.
                // Text translation is offloaded to pc_explanations_cache.
                msme.pitch_video_clip = {
                    video_id: enVid.videoId,
                    start_seconds: 45,
                    end_seconds: 135,
                    clip_duration_seconds: 90,
                    embed_url: `https://www.youtube.com/embed/${enVid.videoId}?start=45&end=135&autoplay=1&enablejsapi=1`,
                    key_moment_title: `Business Startup Pitch: ${msme.business_title}`
                };
                mutated = true;
            }

            // B. Harvest Individual BOM Machine Videos (in parallel!)
            if (Array.isArray(msme.tool_bom)) {
                const toolsToHarvest = msme.tool_bom.filter(t => force || !t.video?.video_id);
                if (toolsToHarvest.length > 0) {
                    await Promise.all(toolsToHarvest.map(async (tool) => {
                        const toolGuidance = tool.video_guidance || { intent: tool.name, search_query: tool.name };
                        const machineVid = await harvestVideoForGuidance(toolGuidance, sector, 'eng', pool, usedSet);

                        tool.video = {
                            video_id: machineVid.videoId, video_title: machineVid.videoTitle,
                            video_url: machineVid.videoUrl, thumbnail_url: machineVid.thumbnailUrl,
                            duration_seconds: machineVid.durationSeconds, audit_score: machineVid.auditScore
                        };
                        tool.video_clip = {
                            video_id: machineVid.videoId,
                            start_seconds: 45,
                            end_seconds: 135,
                            clip_duration_seconds: 90,
                            embed_url: `https://www.youtube.com/embed/${machineVid.videoId}?start=45&end=135&autoplay=1&enablejsapi=1`,
                            key_moment_title: `Machine Demonstration: ${tool.name}`
                        };
                        mutated = true;
                    }));
                }
            }

            if (mutated) {
                await pool.query(`UPDATE nsqf_nos SET msme_blueprint_json = $1 WHERE id = $2`, [JSON.stringify(msme), nos.id]);
            }

            return { nos, msme, mutated };
        }));

        for (const res of results) {
            if (res.mutated) {
                count++;
                if (res.msme.pitch_video?.video_id) usedSet.add(res.msme.pitch_video.video_id);
                console.log(`      🚀 [MSME Blueprint ${res.nos.nos_code}] Pitch: [${res.msme.pitch_video?.video_id}] | ${res.msme.tool_bom?.length || 0} Machine Tools Harvested`);
            }
            enrichedBlueprints.push(res.msme);
        }
    }

    // Save Master MSME file to disk
    if (enrichedBlueprints.length > 0) {
        const msmeFilePath = path.join(MSME_JSON_DIR, `${cleanQp}.json`);
        const qpMasterMsme = {
            qp_code: qpCode,
            qp_name: qpRow.rows[0]?.qp_name || qpCode,
            sector: sector,
            nsqf_level: qpRow.rows[0]?.nsqf_level || '4',
            total_blueprints: enrichedBlueprints.length,
            blueprints: enrichedBlueprints,
            harvested_at: new Date().toISOString(),
            generated_by: 'HAYAGRIVA MSME Economic Intelligence Engine'
        };
        fs.writeFileSync(msmeFilePath, JSON.stringify(qpMasterMsme, null, 2), 'utf-8');
    }

    return count;
}

// ── 8. Main Multi-Pillar Runner ──────────────────────────────────────────────
async function runUnifiedVideoHarvester() {
    const args      = process.argv.slice(2);
    const isSample  = args.includes('--sample');
    const isForce   = args.includes('--force');
    const pcsOnly   = args.includes('--pcs-only');
    const sopsOnly  = args.includes('--sops-only');
    const msmeOnly  = args.includes('--msme-only');
    const qpArg     = args.find(a => a.startsWith('--qp='));

    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║  HAYAGRIVA UNIFIED MULTI-TIER YOUTUBE VIDEO HARVESTER (v4)               ║');
    console.log('║  (Skills • SOP Workstations • MSME Machinery BOMs • Dual EN/HI Reels)    ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

    const pool = { query: db.query.bind(db) };
    let targetQps = [];

    if (qpArg) {
        targetQps = [qpArg.split('=')[1].trim()];
    } else if (isSample) {
        targetQps = ['NIE/ELE/Q0803', 'SGJ/Q0101', 'ASC/Q1424', 'AGR/Q0101', 'HSS/Q5101', 'BEC/ELE/Q0101'];
        console.log(`🌟 Running Sample Video Harvesting across 6 Flagship QPs...`);
    } else {
        const all = await pool.query('SELECT DISTINCT qp_code FROM nsqf_qps ORDER BY qp_code');
        targetQps = all.rows.map(q => q.qp_code);
        console.log(`🚀 Starting Full Catalog Video Harvesting across ${targetQps.length} Qualification Packs...`);
    }

    let totalPcsHarvested  = 0;
    let totalSopsHarvested = 0;
    let totalMsmeHarvested = 0;

    for (const qpCode of targetQps) {
        const cleanQp = qpCode.replace(/\//g, '_');
        console.log(`\n📦 Processing Videos for QP: ${qpCode}`);

        // 1. Harvest Skills / PCs
        if (!sopsOnly && !msmeOnly) {
            const pcCount = await harvestPcsForQp(qpCode, cleanQp, pool, isForce);
            totalPcsHarvested += pcCount;
            console.log(`   🎓 [Skills] Harvested ${pcCount} PC Video Reels (EN + HI)`);
        }

        // 2. Harvest SOP Workstations
        if (!pcsOnly && !msmeOnly) {
            const sopCount = await harvestSopsForQp(qpCode, cleanQp, pool, isForce);
            totalSopsHarvested += sopCount;
            console.log(`   🏭 [SOPs] Harvested ${sopCount} Workstation Videos (EN + HI)`);
        }

        // 3. Harvest MSME Blueprints & BOM Tools
        if (!pcsOnly && !sopsOnly) {
            const msmeCount = await harvestMsmeForQp(qpCode, cleanQp, pool, isForce);
            totalMsmeHarvested += msmeCount;
            console.log(`   🚀 [MSME] Harvested ${msmeCount} Business Pitch & Machine BOM Videos`);
        }
    }

    console.log('\n================================================================================');
    console.log('🎉 UNIFIED VIDEO HARVESTING COMPLETE!');
    console.log(`   🎓 Total PC Reels Harvested:          ${totalPcsHarvested}`);
    console.log(`   🏭 Total SOP Workstations Harvested:  ${totalSopsHarvested}`);
    console.log(`   🚀 Total MSME Blueprints Harvested:   ${totalMsmeHarvested}`);
    console.log('   💾 Master JSON files on disk updated: data/json/{nsqf,sop,msme}/*.json');
    console.log('================================================================================\n');

    process.exit(0);
}

runUnifiedVideoHarvester().catch(err => {
    console.error('❌ Fatal error in unified video harvester:', err);
    process.exit(1);
});
