# Archived / Deprecated Scripts

These scripts have been superseded by the unified pipeline architecture.
Do NOT use in new work. Kept for historical reference only.

| Script | Superseded By | Reason |
|--------|--------------|--------|
| `parse_nsqf_pdf.js` | `nsqf_pass2_unified.js` | One-off test script; hardcoded API keys; no pipeline integration |
| `nsqf_youtube_query_optimizer.js` | `nsqf_pass2_unified.js` | Merged into unified Pass 2 local NLP engine |
| `nsqf_targeted_llm_refiner.js` | `nsqf_pass2_unified.js` | Merged into unified Pass 2 hybrid Sarvam AI mode |
| `nsqf_pass2_intent_synthesis.js` | `nsqf_pass2_unified.js` | Replaced by unified Pass 2 (cloud/hybrid modes) |
| `harvest_amh_q0103_videos.js` | `nsqf_video_harvester.js` | One-off AMH sector script; wrote to ghost nsqf_videos table |
| `audit_all_amh_q0103.js` | `nsqf_pass4_editorial_review.js` | One-off audit; superseded by batch Pass 4 editorial review |
| `harvest_audit_seed_ele0803.js` | `nsqf_video_harvester.js` | One-off ELE/Q0803 seed; fabricated audit scores; Neon direct-connect |
| `fix_pc_ordering.js` | `nsqf_pass1_structure_ingest.js` | Ordering now handled inside Pass 1 transaction (step 5) |
| `nsqf_structure_extractor.js` | `nsqf_pass1_structure_ingest.js` | Merged into Pass 1 |

## Active Pipeline Scripts

The canonical pipeline is now:

```
scripts/
  nsqf_pdf_harvester.js          → Step 1.1: Download PDFs
  nsqf_pdf_to_md.py              → Step 1.2: Convert PDF → Markdown
  nsqf_pass1_structure_ingest.js → Pass 1:   Parse MD → nsqf_nos / nsqf_pcs
  nsqf_pass2_unified.js          → Pass 2:   Intent synthesis (hybrid default)
  nsqf_video_harvester.js        → Pass 3:   YouTube video harvesting
  nsqf_pass4_editorial_review.js → Pass 4:   Batch editorial quality review
  nsqf_pipeline_orchestrator.js  → Full run: Orchestrates all passes with FSM
```
