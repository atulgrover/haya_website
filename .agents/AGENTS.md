# Project Workspace Rules

- Always commit and push code changes to git (`origin main`) after completing implementation and verification tasks.

## Project Memory & Context (HAYAGRIVA Platform)

### Core Architecture & Portal Layout
- **Public Marketing Site**: `index.html` (SPA with tabs: `Home` [blue button style], `GATEWAY`, `WORKBENCH`, `MARKETPLACE`, `Research`, `Portal`).
- **User Portal Dashboard**: `dashboard.html` (Logged-in area with tabs: `🔑 License & Payments`, `🖥️ Hayagriva IPE`, `🧠 LLM Models`, `📚 Data Vaults`, `🤖 IBC Agents`, `📊 Marketplace Reports`, `👤 Profile & Settings`).
- **Auth Flow**: `login.html` and `signup.html` backed by `server/routes/auth.js` (`POST /api/auth/login`, `POST /api/auth/signup`) using SQLite (`server/db.js`), `bcryptjs`, and JWT tokens.
- **Pricing Model**: Pure Pay-As-You-Go (A La Carte) with dynamic Razorpay payment creation & verification (`server/routes/payments.js`) which generates & updates master Ed25519 license keys.
- **Marketplace Reports**: Custom report ordering system backed by `server/routes/reports.js` and `report_orders` SQLite table.
- **Strategic Roadmap**: `roadmap/HAYAGRIVA_PORTAL_ROADMAP.md`.

