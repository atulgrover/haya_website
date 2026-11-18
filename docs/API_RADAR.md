# Developer Guide: API Radar & Subagent Integration

This guide provides developers and hackathon participants with the technical specifications, endpoints, and data contracts required to integrate with the four sovereign microservices running on Ports 3001, 3002, 3003, and 3004.

---

## 1. Quick Endpoint Reference

| Service | Host & Port | Primary Purpose | Base Health URL |
| :--- | :--- | :--- | :--- |
| **Skills Academy** | `http://localhost:3001` | NSQF Curricular Modules & Progress | `GET /` |
| **OpenIBC Sovereign** | `http://localhost:3002` | NCLT Insolvency & CIRP Radar | `GET /` |
| **OpenBNS Sovereign** | `http://localhost:3003` | Bharatiya Nyaya Sanhita Radar | `GET /` |
| **HackNStay Super-App** | `http://localhost:3004` | Spaces, Menu, Groups & Events | `GET /` |

---

## 2. Port 3001: Sovereign Skills Academy

### Overview
Provides curricular benchmarks, qualification levels (NSQF 4, 5, 6), and student competency evaluation endpoints.

### Querying Curriculum Tracks
```bash
# Fetch live module listing
curl -X GET http://localhost:3001/api/modules \
  -H "Accept: application/json"
```

### Sample Response
```json
{
  "status": "success",
  "modules": [
    {
      "id": "mod-nsqf-l5-ai",
      "title": "Agentic AI Engineering",
      "nsqfLevel": 5,
      "competencies": [
        "Autonomous Tool Calling",
        "Multi-Agent Orchestration",
        "Vector Search Retrieval",
        "Local LLM Edge Inference"
      ]
    },
    {
      "id": "mod-nsqf-l6-cloud",
      "title": "Cloud Native Microservices",
      "nsqfLevel": 6,
      "competencies": [
        "Go Microservices Architecture",
        "PostgreSQL Pooling",
        "Render Multi-Service Deployment"
      ]
    }
  ]
}
```

---

## 3. Port 3002: OpenIBC Corporate Insolvency Radar

### Overview
A Go-powered microservice indexing corporate insolvency proceedings under the Insolvency and Bankruptcy Code (IBC, 2016).

### Querying CIRP Case Status
```bash
# Query active NCLT tribunal status by Corporate Debtor Name
curl -X GET "http://localhost:3002/api/cirp/status?company=InfraTech%20Enterprises" \
  -H "Accept: application/json"
```

### Sample Response
```json
{
  "status": "ACTIVE_CIRP",
  "cin": "L45200DL2010PLC201948",
  "corporateDebtor": "InfraTech Enterprises Ltd",
  "bench": "NCLT New Delhi Bench-II",
  "admissionDate": "2026-08-14",
  "resolutionProfessional": "Adv. Rajesh Kumar (IBBI/IPA-002/2018)",
  "claimsAdmitted": {
    "financialCreditors": "₹428.50 Cr",
    "operationalCreditors": "₹64.20 Cr"
  },
  "statutoryDay": 164,
  "maxPermittedDays": 330
}
```

---

## 4. Port 3003: OpenBNS Criminal Jurisprudence Radar

### Overview
A Go-powered microservice providing statutory lookup and forensic validation under the Bharatiya Nyaya Sanhita (BNS).

### Querying Statutory Mapping (IPC to BNS)
```bash
# Map legacy IPC section to modern BNS statutory provisions
curl -X GET "http://localhost:3003/api/bns/lookup?section=420" \
  -H "Accept: application/json"
```

### Sample Response
```json
{
  "legacyIPCSection": "Section 420 (Cheating and dishonestly inducing delivery of property)",
  "bnsEquivalent": "Section 318(4) Bharatiya Nyaya Sanhita, 2023",
  "cognizable": true,
  "bailable": false,
  "courtTriable": "Magistrate of First Class",
  "maxImprisonment": "Up to 7 years and fine",
  "proceduralNotes": "Electronic records of bank transactions must be certified under Section 61 BNS evidence guidelines."
}
```

---

## 5. Port 3004: HackNStay Phygital Super-App

### Overview
A React 19 / Vite single-page application orchestrating physical hotel/cafe spaces, artisanal food/beverage, tribes, and events.

### Client-Side Interfaces
* **Reservation API:** Communicates with Firestore / Local DB to reserve Private Agent Pods, Briefing Rooms, and The Hack Arena.
* **Menu POS API:** Dispatches food and beverage orders with seat/room delivery identifiers.
* **Tribe Metadata:** Links new groups to NSQF and Legal cohorts.

---

## 6. How Hackathon Teams Build Subagents

Developers can write autonomous Python or Node.js agents that connect these ports:

```python
import requests

class AgenticHospitalityAgent:
    def __init__(self, base_skills="http://localhost:3001", base_legal="http://localhost:3002"):
        self.skills_url = base_skills
        self.legal_url = base_legal

    def audit_hacker_submission(self, repo_url, track):
        if track == "IBC_FINTECH":
            # Query Port 3002 for statutory validation
            res = requests.get(f"{self.legal_url}/api/cirp/status?company=TestDebtor")
            return res.json()
        elif track == "AI_SKILLS":
            # Query Port 3001 for NSQF Level 5 competencies
            res = requests.get(f"{self.skills_url}/api/modules")
            return res.json()

# Test the agent
agent = AgenticHospitalityAgent()
print("Agent initialized and ready for HackNStay hackathon integration.")
```
