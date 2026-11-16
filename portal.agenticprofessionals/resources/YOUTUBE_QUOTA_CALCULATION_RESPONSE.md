# YouTube API Services Compliance Review — Revised Quota Calculation & Breakdown

**Date:** August 20, 2026  
**To:** YouTube API Services Compliance Team (`yt-api-compliance@google.com`)  
**From:** Atul Grover (`hayagriva.app@gmail.com`)  
**Google Cloud Project:** `hayagriva-youtube-api` (Project Number: `99124607688`)  
**Subject:** Revised Quota Breakdown & Calculations based on Updated Quota Calculator — Project: `hayagriva-youtube-api` (Project # 99124607688)

---

## Formal Response to YouTube API Services Compliance Team

**Dear YouTube API Services Compliance Team,**

Thank you for your guidance regarding the updated quota calculation methodology. We have recalculated our daily quota requirements using the official **YouTube Data API Quota Calculator** ([https://developers.google.com/youtube/v3/determine_quota_cost](https://developers.google.com/youtube/v3/determine_quota_cost)) based strictly on our launch phase user base.

Below is our revised, transparent quota breakdown and calculations:

---

### **1. API Endpoints and Expected Usage for Each Endpoint**

We utilize strictly two read-only endpoints to map practical educational demonstration videos to National Skills Qualification Framework (NSQF) vocational competencies:

| API Endpoint | HTTP Method | Part Parameters | Quota Cost per Call (Official Calculator) | Expected Functional Usage |
|---|---|---|---|---|
| `search.list` | `GET /youtube/v3/search` | `part=snippet` | **100 units** | Querying relevant practical vocational demonstration and machine operation videos corresponding to specific occupational standards. Parameters: `type=video`, `videoEmbeddable=true`, `maxResults=5`. |
| `videos.list` | `GET /youtube/v3/videos` | `part=snippet,contentDetails,status` | **1 unit** | Validating embeddability status (`status.embeddable = true`), region availability, and duration before rendering in educational modals. |

*Note: All video playback occurs strictly via the official client-side YouTube IFrame Embed Player. We make zero write/upload/mutation API calls.*

---

### **2. Estimated API Call Volumes & Quota Calculations**

Our calculations are modeled around our initial launch cohort of **50–100 Daily Active Users (DAU)** and adherence to the 7-day ephemeral cache retention requirement:

#### **A. Daily Call Volume Breakdown**
1. **User Real-Time Searches (Uncached queries):**
   * Projected Daily Searches: ~500–600 searches/day across 100 active trainees.
   * 7-Day Ephemeral Cache Hit Rate: ~60% in initial launch phase.
   * **Uncached `search.list` Calls:** `600 × 40% = 240 calls/day`
2. **Rolling 7-Day Ephemeral Cache Refresh (Policy III.E.4.a-g):**
   * In strict compliance with Developer Policy III.E.4, search metadata is purged after 7 days. Re-verifying active educational modules across a 7-day rolling cycle requires: **150 calls/day**.
3. **Institutional Peak Training Hours Buffer:**
   * Buffer for concurrent classroom demonstrations and lab sessions: **110 calls/day**.
4. **`videos.list` Verification:**
   * Validating candidate embeddability and status: **500 calls/day**.

#### **B. Quota Calculation (New Calculator Formula)**

$$\begin{aligned}
\text{Total } \texttt{search.list} \text{ Calls} &= 240 + 150 + 110 = \mathbf{500 \text{ calls/day}} \\
\text{Total } \texttt{videos.list} \text{ Calls} &= \mathbf{500 \text{ calls/day}}
\end{aligned}$$

| API Endpoint | Estimated Daily Calls | Quota Cost per Call | Total Daily Quota Units |
|---|---|---|---|
| `search.list` | 500 calls | 100 units | 50,000 units |
| `videos.list` | 500 calls | 1 unit | 500 units |
| **Total Calculated Baseline** | **1,000 calls** | **—** | **50,500 units/day** |
| **Requested Allocation** | \multicolumn{2}{c|}{**Realistic Initial Tier**} | **60,000 units/day** |

*(Note: If YouTube allocates in standard 50,000 or 100,000 unit tiers, an allocation of **60,000 to 100,000 units/day** provides the ideal operational ceiling for this phase.)*

---

### **3. Current and Projected User Traffic**

* **Current Launch Phase:**
  * **Daily Active Users (DAU):** 50 – 100 DAU (Vocational trainees, ITI instructors, and MSME apprentices participating in initial pilots).
  * **Daily Searches / Inspections:** ~400 – 600 queries/day.
* **Projected 6–12 Month Horizon:**
  * **Daily Active Users (DAU):** 1,000 – 2,500 DAU as additional vocational batches join.

---

### **4. Growth Plans and Factors Driving the Requested Quota Increase**

1. **Inadequacy of Default Quota (10,000 units):**
   * At 100 units per `search.list` call, the default 10,000 quota allows only 100 searches per day total. This is exhausted by just 10–15 users, making standard educational testing impossible without this modest increase to 60,000 units.
2. **Strict Adherence to 7-Day Ephemeral Caching (Policy III.E.4):**
   * Because we purge all cached search metadata after 7 days to strictly comply with YouTube policy, we cannot store results permanently and rely on rolling API checks.
3. **Phased Growth Approach:**
   * We are deliberately requesting a modest initial quota of **60,000 units/day** sized specifically for our initial 100 users. As institutional adoption expands and we observe sustained 80%+ utilization in our Google Cloud Console, we will submit follow-up extension requests backed by live analytics.
4. **100% Free Public Vocational Education:**
   * HAYAGRIVA NSQF Skillpedia is completely free, non-monetized, and open to all vocational students in India with zero paywalls.

---

### **Summary:**
* **Google Cloud Project ID:** `hayagriva-youtube-api` (Project Number: `99124607688`)
* **Current Quota:** 10,000 units/day
* **Revised Requested Quota:** **60,000 units/day** (or standard tier of 100,000 units/day)

Thank you for your continued support and partnership. Please let us know if any further clarification is required.

Sincerely,

**Atul Grover**  
Lead Architect & Developer, HAYAGRIVA Platform  
Email: [hayagriva.app@gmail.com](mailto:hayagriva.app@gmail.com)  
Website: [https://hayagriva.app](https://hayagriva.app)  
Location: Chandigarh, India
