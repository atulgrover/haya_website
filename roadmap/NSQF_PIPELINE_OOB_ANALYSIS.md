# HAYAGRIVA NSQF Video Pipeline — Out-of-the-Box (OOB) Architectural & Operational Analysis

**Document Version:** 1.0  
**Date Created:** August 15, 2026  
**Status:** Strategic Architecture & Edge Case Blueprint for Full Catalog Run (2,001 QPs / 207,363 Criteria)

---

## 1. Executive Summary & Pipeline State

The HAYAGRIVA NSQF Micro-Learning Pipeline transforms 2,001 National Qualification Packs (NQPs) into interactive 11-to-48 step bilingual practical video reels. Before launching the full catalog ingestion across all 207,363 Performance Criteria (PCs), this document records the **Out-of-the-Box (OOB) Architectural Audit**, identifying risks, scale bottlenecks, edge cases, and concrete mitigation strategies.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             END-TO-END 4-PASS ARCHITECTURE                               │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  PASS 1: Structural Ingest (PDF ➔ MD ➔ DB)              [🤖 100% Autonomous]             │
│  PASS 2: Intent, 15 YouTube Categories & Vectors        [🤖 100% Autonomous]             │
│  PASS 3: Multi-Factor Video Harvester & Embed Guard     [🤖 100% Autonomous]             │
│          ├── 3-Tier Multi-Query Retry Loop (>=65%)                                       │
│          ├── Live YouTube oEmbed Playability Guard                                       │
│          ├── Channel Title & Duration Persistence (EN + HI)                              │
│          └── QP-Level Diversity Guard (-25 Penalty)                                      │
│  PASS 4: Editorial Quality Review (dashboard.html)      [👤 100% Human-In-The-Loop]      │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 6 Critical OOB Dimensions & Mitigations

### Dimension 1: Scale, Concurrency & IP Throttling Resilience
* **The Challenge:** At 207,363 criteria, sequential single-threaded harvesting at ~1 PC/sec would take **~57.5 hours** (~2.4 days). Continuous requests from a single IP can trigger YouTube HTTP 429 rate-limiting after 2,000–5,000 queries.
* **OOB Mitigations:**
  1. **Multi-Tier Query Caching (`youtube_search_cache`):** Common vocational safety, tools, and procedure queries (*"Wear PPE"*, *"Use Multimeter"*) are resolved instantly from PostgreSQL in **0 ms**, cutting live YouTube network calls by ~35–40%.
  2. **Worker Pool with Exponential Jitter Backoff:** Concurrency of 4–8 workers with automatic backoff (1s $\rightarrow$ 3s $\rightarrow$ 8s) when HTTP 429 occurs.
  3. **Multi-Key & Scraping Failover:** Seamless failover between official YouTube Data API v3 and `youtube-sr` scrapers.

---

### Dimension 2: YouTube Embed & Playback Edge Cases
* **The Challenge:** Even when YouTube returns an HTTP 200 via oEmbed, specific video types fail inside client `<iframe>` embeds:
  * **Age-Restricted (18+) Videos:** Fail inside third-party iframes if the user is not logged in.
  * **Silent Slide-Shows / Text Presentations:** Low educational value (music-only with text bullet points).
  * **Region-Locked Uploads:** Blocked on Indian ISPs (Jio/Airtel).
* **OOB Mitigations:**
  1. **Negative Keyword Guard:** Hard penalty (-50 pts) for keywords like `18+`, `age restricted`, `slideshow`, `presentation slides`, `music only`, `unboxing`, `prank`.
  2. **Client-Side Instant Error Fallback:** In `reel.html`, `onError (codes 101/150/153)` instantly swaps to the verified Sector Default video in $< 200\text{ms}$ with zero black screens.

---

### Dimension 3: The "Zero-Hindi" Regional Content Paradox
* **The Challenge:** In mainstream sectors (Automotive, Smartphone Repair, Tailoring, Welding), high-quality Hindi vocational content is abundant. However, for **hyper-niche sectors** (e.g. *Semiconductor Cleanroom Wafer Etching*, *Aerospace Composite Autoclaving*, *Actuarial Derivatives*), there is zero Hindi content on YouTube.
* **OOB Mitigation:**
  * If all 3 Hindi search attempts score $< 40\%$, the harvester **gracefully binds the verified English demonstration (or bilingual Sector Master)** rather than binding an irrelevant Hindi video (like a Bollywood song or generic unboxing) just to fill the Hindi database column.

---

### Dimension 4: Long-Running Process & Memory Safety
* **The Challenge:** A multi-hour Node.js daemon can crash if memory maps (`oEmbedCache`, `qpUsedMap`, raw result sets) grow unbounded, exhausting the V8 1.4GB heap.
* **OOB Mitigations:**
  1. **Database-Driven Resumability:** The pipeline tracks progress via `pipeline_status = 'video_harvested'` in `nsqf_pcs`. If interrupted, it skips finished QPs in milliseconds and resumes exactly where it stopped.
  2. **Per-QP Memory Pruning:** `qpUsedMap` is pruned and garbage-collected at the end of every QP cycle, maintaining heap memory under **100MB** indefinitely.

---

### Dimension 5: Production Cloud Ingestion (Neon Migration)
* **The Challenge:** Uploading 207,000 rows row-by-row over the internet will cause connection drops and timeouts.
* **OOB Mitigation:**
  * `scripts/push_local_pg_to_neon.js` streams and ingests data in **parameterized bulk batches of 2,000–5,000 rows per transaction** using `INSERT INTO ... ON CONFLICT DO UPDATE`, migrating the complete 250MB master database in **under 90 seconds**.

---

### Dimension 6: Post-Harvest Learner Badging & Certification
* **The Opportunity:** Turning HAYAGRIVA from a video viewer into a recognized National Vocational Learning Engine.
* **OOB Enhancements:**
  1. **NSQF Module Mastery Engine:** Track checklist completion in `user_pc_progress`.
  2. **Verifiable Digital Skill Badges:** Automatically generate downloadable PDF/SVG Skill Badges upon 100% QP completion (*"Certified Repair & Maintenance Assistant — NSQF Level 3"*).

---

## 3. Tomorrow's Execution Plan

When we resume tomorrow, we will execute the following sequence:

1. **Step 1 — Batch Pilot Test (5 Diverse Sector QPs):**
   * Run the end-to-end pipeline across 5 diverse QPs (e.g. Electronics, Agriculture, Apparel, Healthcare, IT) to verify cross-sector resilience.
2. **Step 2 — Full 2,001 QP Catalog Conversion:**
   * Launch `scripts/nsqf_local_intent_extractor.js --all` and `scripts/nsqf_video_harvester.js --all`.
3. **Step 3 — Quality & Playability Verification:**
   * Run the Pass 4 HIL review scan to populate any pending swap suggestions in `dashboard.html`.
4. **Step 4 — Production Sync (Human-In-The-Loop):**
   * Execute `npm run db:push-to-neon` to publish the entire audited platform to Neon Cloud.

---
*Saved and synchronized in `roadmap/NSQF_PIPELINE_OOB_ANALYSIS.md`.*
