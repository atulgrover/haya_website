# YouTube API Services Compliance Review — Revised Quota Calculation & Breakdown

**Date:** August 20, 2026  
**To:** YouTube API Services Compliance Team (`yt-api-compliance@google.com`)  
**From:** Atul Grover (`hayagriva.app@gmail.com`)  
**Google Cloud Project:** `hayagriva-youtube-api` (Project Number: `99124607688`)  
**Subject:** Revised Quota Breakdown & Calculations based on Updated Quota Calculator — Project: `hayagriva-youtube-api` (Project # 99124607688)

---

## Formal Response to YouTube API Services Compliance Team

**Dear YouTube API Services Compliance Team,**

Thank you for your review and for confirming that the previously identified violations have been successfully resolved. 

In accordance with your request, we have recalculated our daily quota requirements using the updated **YouTube Data API Quota Calculator** ([https://developers.google.com/youtube/v3/determine_quota_cost](https://developers.google.com/youtube/v3/determine_quota_cost)).

Below is the detailed quota breakdown, mathematical calculations, call volumes, user traffic models, and growth drivers structured in the requested four-part format.

---

### **1. API Endpoints and Expected Usage for Each Endpoint**

Our platform (**HAYAGRIVA NSQF Skillpedia**) uses only two read-only endpoints from the YouTube Data API v3 to map practical vocational skill demonstration videos to India's National Skills Qualification Framework (NSQF) competency standards:

| # | API Endpoint | HTTP Method | Part Parameters Requested | Quota Cost per Call (Official Calculator) | Expected Functional Usage |
|---|---|---|---|---|---|
| **1** | `search.list` | `GET /youtube/v3/search` | `part=snippet` | **100 units** | Querying relevant practical vocational demonstration and machine operation videos corresponding to specific occupational standards and performance criteria. Filters applied: `type=video`, `videoEmbeddable=true`, `maxResults=5`. |
| **2** | `videos.list` | `GET /youtube/v3/videos` | `part=snippet,contentDetails,status` | **1 unit** | Inspecting video metadata, validating stream embeddability (`status.embeddable = true`), license status, region restrictions, and duration prior to rendering in educational modals. Batch queries of up to 50 video IDs per call. |

> **Note on Write / Mutation Endpoints:**  
> Our application performs **zero write, upload, modify, rating, or comment operations**. We utilize strictly read-only metadata lookups. All actual video playback occurs via the official YouTube IFrame Embed Player on the client side.

---

### **2. Estimated API Call Volumes & Quota Calculations**

Based on the official cost of **100 units per `search.list` call** and **1 unit per `videos.list` call**, our daily volume calculations are detailed below:

#### **A. Daily Call Volume Breakdown**

1. **User Real-Time Searches (Uncached queries):**
   * **Projected Daily User Queries:** 40,000 queries/day
   * **7-Day Rolling Ephemeral Cache Hit Rate:** ~85% (in compliance with Developer Policy III.E.4.a-g)
   * **Uncached API `search.list` Calls:** `40,000 × 15% = 6,000 calls/day`

2. **Automated 7-Day Rolling Ephemeral Cache Refresh:**
   * In compliance with Policy III.E.4.a-g, our PostgreSQL database maintains a 7-day TTL on search cache entries, purging daily.
   * To keep educational mappings fresh across 11,420 National Occupational Standards (NOS):
   * **Daily Background Refresh Calls:** `11,420 NOS units ÷ 7 days = ~1,630 search.list calls/day`

3. **Peak Training Hours & Curriculum Expansion Buffer:**
   * Buffer for concurrent institutional training sessions and seasonal surges: **1,370 calls/day**

4. **`videos.list` Batch Verification:**
   * Validating candidate videos retrieved from search results (batched up to 50 IDs per request): **10,000 calls/day**

#### **B. Total Daily Quota Cost Calculation**

$$\begin{aligned}
\text{Total } \texttt{search.list} \text{ Calls} &= 6,000 + 1,630 + 1,370 = \mathbf{9,000 \text{ calls/day}} \\
\text{Total } \texttt{videos.list} \text{ Calls} &= \mathbf{10,000 \text{ calls/day}}
\end{aligned}$$

$$\begin{array}{|l|r|r|r|}
\hline
\textbf{API Endpoint} & \textbf{Daily Calls} & \textbf{Unit Cost / Call} & \textbf{Total Daily Quota Units} \\
\hline
\texttt{search.list} & 9,000 & 100\text{ units} & 900,000\text{ units} \\
\texttt{videos.list} & 10,000 & 1\text{ unit} & 10,000\text{ units} \\
\hline
\textbf{Total Calculated Baseline} & \mathbf{19,000} & \textbf{—} & \mathbf{910,000\text{ units/day}} \\
\hline
\textbf{Requested Daily Quota Allocation} & \multicolumn{2}{c|}{\textbf{Rounded to standard tier}} & \mathbf{1,000,000\text{ units/day}} \\
\hline
\end{array}$$

---

### **3. Current and Projected User Traffic**

HAYAGRIVA is an open vocational skill intelligence platform indexing national qualification packs and operational standards across 41 sectors of the Indian economy.

| Metric | Current Phase (Beta / Institutional Pilots) | Projected (6–12 Month Horizon) | Projected (18–24 Month National Rollout) |
|---|---|---|---|
| **Daily Active Users (DAU)** | 1,500 – 2,500 DAU | 25,000 – 50,000 DAU | 150,000+ DAU |
| **Monthly Active Users (MAU)** | 20,000 – 35,000 MAU | 400,000 – 750,000 MAU | 2,500,000+ MAU |
| **Daily Video Inspections** | ~3,000 inspections/day | ~60,000 – 100,000 inspections/day | 300,000+ inspections/day |
| **Primary User Demographics** | Vocational trainees, ITI instructors, Polytechnic students, MSME apprentice mentors | Vocational training centers, NSDC accredited partners, ITIs, MSME enterprise clusters | National vocational education ecosystem across all 28 Indian states |

---

### **4. Growth Plans and Factors Driving the Requested Quota Increase**

Several key operational and architectural factors necessitate this quota allocation:

1. **National Curriculum Scale (2,176 Job Roles & 11,420 Modules):**
   * HAYAGRIVA indexes all 2,176 NCVET Qualification Packs, 11,420 National Occupational Standards, and 207,363 Performance Criteria across 41 economic sectors (Automotive, Electronics, Healthcare, Green Jobs, Agriculture, Capital Goods, etc.).
   * Delivering high-fidelity practical demonstrations for this vast taxonomy requires comprehensive query volume.

2. **Compliance with Developer Policy III.E.4 (7-Day Ephemeral Cache Limit):**
   * To ensure 100% adherence to YouTube API Policy III.E.4.a-g, our PostgreSQL database purges search records older than 7 days.
   * Because we do not store metadata long-term, our system continuously re-verifies educational video availability through fresh API calls on a rolling 7-day schedule.

3. **Institutional Rollouts across Industrial Training Institutes (ITIs):**
   * We are partnering with vocational training institutes, ITIs, and skill universities across India where hundreds of students in batch labs explore standard operating procedures (SOPs) simultaneously during classroom hours.

4. **Multi-Perspective Educational Model:**
   * For each competency unit, users can examine:
     - **Skill Perspective:** Individual hand-tool demonstration clips.
     - **SOP Perspective:** Industrial workstation walkthroughs.
     - **MSME / Machinery Perspective:** Commercial machine tool operation demonstrations.
   * This unified 3-perspective model increases user engagement per session while maintaining educational focus.

5. **100% Free & Open Non-Monetized Access:**
   * HAYAGRIVA NSQF Skillpedia is a free public educational initiative designed to bridge India's vocational skill gap. There are no paywalls, subscriptions, or gated access for viewing YouTube content.

---

### **Summary of Request:**
* **Current Quota:** 10,000 units/day
* **Requested Quota:** **1,000,000 units/day**
* **Primary Endpoints:** `search.list` (9,000 calls @ 100 units) and `videos.list` (10,000 calls @ 1 unit)
* **GCP Project ID:** `hayagriva-youtube-api` (Project Number: `99124607688`)

We remain fully committed to ongoing compliance with all YouTube API Services Terms of Service and Developer Policies. Please let us know if any further information or technical details are needed.

Sincerely,

**Atul Grover**  
Lead Architect & Developer, HAYAGRIVA Platform  
Email: [hayagriva.app@gmail.com](mailto:hayagriva.app@gmail.com)  
Website: [https://hayagriva.app](https://hayagriva.app)  
Location: Chandigarh, India
