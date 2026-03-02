# SGTechSkillz — Prioritized Build Plan

## 1. Executive Summary

- **All three recommendations converge** on the same insight: the word cloud is a good entry point but not the primary interface. Ranked lists, filters with live counts, and drill-down to actual jobs are the real value.
- **The database is the strongest asset.** LLM-extracted structured data (skills, seniority, industry, company type) is already done — most projects never get this far. The website just needs to surface it well.
- **Students want a 2-minute flow**: see top skills → filter by interest → find real jobs to apply to. Every feature should serve this journey.
- **Faculty want curriculum intelligence**: which skills are in demand, how demand varies by seniority, and what gaps exist between curriculum and market.
- **Start with static pre-aggregated data**, not a live backend. The dataset is finite and changes infrequently (scraped periodically). A build-time ETL step that produces JSON files is simpler, faster, and more deployable than a Python API server.
- **Ship a single-page dashboard first.** Multi-page architecture adds routing complexity without adding value until you have enough content to justify it.
- **Avoid premature optimization traps**: co-occurrence networks, career pathway AI, and trend analysis all sound impressive but require significantly more engineering for marginal early impact.
- **Weekly iterations matter more than feature completeness.** A working filter + ranked list deployed in week 1 is worth more than a perfect dashboard in month 2.
- **Align with CLAUDE.md principles**: use semantic HTML, native CSS, minimal JS. No framework needed for the MVP — the data is small enough for client-side filtering.

---

## 2. Prioritized Feature List

| Rank | Feature | Problem It Solves | Audience | Impact | Complexity | Why This Order |
|------|---------|-------------------|----------|--------|------------|----------------|
| 1 | **Ranked Skills Table with Counts** | "What skills should I learn?" — the #1 question | Both | **High** | **Low** | Core value prop. Answers the primary question immediately. Requires only a COUNT + GROUP BY pre-aggregation. |
| 2 | **Filter Panel with Live Counts** | "Show me only internships / only FinTech / only Junior roles" | Both | **High** | **Medium** | Transforms a static table into an interactive tool. Filters are what make the data personal and actionable. |
| 3 | **Skill Drill-Down to Job List** | "Which actual jobs need Python?" | Students | **High** | **Low** | Closes the loop from insight → action. Students need to see real postings, not just counts. |
| 4 | **Skill Category Tabs** | "Show me just frameworks" vs "show me just languages" | Both | **Medium** | **Low** | The DB already separates these fields. Tabs let users focus on what matters to them without visual overload. |
| 5 | **Company & Industry Breakdown** | "What kinds of companies are hiring? What industries?" | Both | **Medium** | **Medium** | Faculty use this for curriculum alignment. Students use it to target industries. Data already exists in `job_company_analysis`. |
| 6 | **Seniority Distribution View** | "What does the market look like for fresh grads vs mid-level?" | Both | **Medium** | **Low** | Extremely valuable for students gauging where they fit. Simple bar chart from `seniority_level`. |
| 7 | **Job Search & Browse** | "Let me search for a specific role or company" | Students | **Medium** | **Medium** | Full-text search across titles, companies, skills. Important but secondary to the aggregated views. |
| 8 | **Word Cloud (Toggle)** | Visual engagement, scannable overview | Both | **Low** | **Medium** | Looks good, draws people in, but all three recommendations agree it's a secondary visualization. Build it as an optional toggle on top of the ranked list. |
| 9 | **Skill Trends Over Time** | "Is React demand growing or falling?" | Faculty | **Medium** | **High** | Requires time-series data with enough history. Very valuable once you have 3+ months of scrapes. Not useful with a single snapshot. |
| 10 | **Career Pathway / Skill Gap** | "I know Python and SQL — what should I learn next?" | Students | **High** | **High** | Unique differentiator that no job board offers. But requires significant UI work (skill selection, matching logic, clear presentation). Phase 3 feature. |

---

## 3. Staged Development Roadmap

### Phase 1 — MVP (Weeks 1–2): "See the Market"

**Features included:**
- Pre-aggregated skill counts as JSON (build-time ETL from SQLite)
- Ranked skills table (Skill | Count | % of Jobs) — sortable
- Skill category tabs (All / Languages / Frameworks / Tools / Concepts / Domain)
- Filter sidebar: Work Type, Seniority, Role Category (search_queries) — with live counts
- Click any skill → slide-out panel showing matching job cards (title, company, work type, date, link to JobStreet)
- Responsive single-page layout, semantic HTML, native CSS

**What users can do:**
- See the top skills in the Singapore tech job market at a glance
- Filter to internships-only or full-time-only and watch counts update
- Click "Python (187)" and see the actual 187 jobs
- Click through to JobStreet to apply

**Intentionally excluded:**
- Word cloud (adds library dependency, low precision value)
- Full-text search (client-side filtering on pre-loaded data is sufficient at this scale)
- Charts and visualizations beyond the table
- Company/industry explorer
- Trends over time
- Career pathway features

**Technical approach:**
- Python script reads SQLite → produces `skills.json`, `jobs.json`, `filters.json`
- Static HTML + CSS + vanilla JS
- Client-side filtering on the JSON data (dataset is small enough — likely <2000 jobs)
- Deployable to any static host (GitHub Pages, Netlify, Vercel)
- No backend server needed

---

### Phase 2 — Insight Expansion (Weeks 3–4): "Explore the Landscape"

**Added capabilities:**
- Company & Industry tab: horizontal bar chart of industries by job count, company type breakdown (MNC/Startup/Gov), company explorer table
- Seniority distribution view: bar chart showing Fresh Grad / Junior / Mid / Senior split, filterable
- Word cloud as optional toggle above the skills table (using a lightweight library like `d3-cloud`)
- Job search: client-side fuzzy search across job titles, company names, and extracted skills
- Job detail view: full description + all extracted skills displayed cleanly
- URL query parameters for shareable filtered views

**UX improvements:**
- Greyed-out zero-count filters (not hidden) so users understand what's missing
- Smoother transitions when filters change
- Better mobile layout
- `prefers-color-scheme` dark mode support
- `prefers-reduced-motion` respect for animations

**Data enrichment:**
- Skill normalization ETL step (merge "Python3" → "Python", "JS" → "JavaScript")
- Pre-computed co-occurring skills per skill (e.g., Python jobs also commonly need: AWS, Docker, SQL)
- Salary range parsing and display where available

---

### Phase 3 — Advanced Analytics & Polish (Weeks 5–8): "Act on Insights"

**Advanced visualizations:**
- Skill trends over time (line charts using `listing_date_iso` — requires accumulated scrape history)
- Skill co-occurrence display: "If you learn Python, you'll also commonly need: AWS (63%), Docker (48%), SQL (72%)"
- Seniority progression: "Junior → Mid requires adding: System Design, Mentoring, Architecture"
- Internship seasonality patterns

**Career pathway (the differentiator):**
- Student selects skills they know → system shows matching jobs + top missing skills
- "Next skill to maximize employability" recommendation
- Comparison mode: side-by-side skill requirements for two roles

**Faculty-specific features:**
- Curriculum gap report: Top 20 market skills vs. program curriculum
- Exportable skill demand reports (CSV/PDF)
- Scrape history timeline showing data freshness

**Performance optimization:**
- If dataset grows significantly, move to a lightweight API (FastAPI serving SQLite)
- Consider SQLite FTS5 for full-text search at scale
- Lazy loading for job detail content

---

## 4. Architecture & Technical Recommendations

### Frontend Stack

**MVP (Phase 1–2):** Plain HTML + CSS + vanilla JavaScript
- Follows the project's own CLAUDE.md hierarchy: "Can plain HTML do this? Use it."
- The dataset is small (~1000–2000 jobs). Client-side filtering is instant.
- No build tools needed. Zero dependencies for MVP.
- Use `<dialog>` for drill-down panels, `<details>` for collapsible sections, `<table>` for rankings.
- CSS Grid for the filter sidebar + main content layout. CSS custom properties for theming.

**Phase 2+:** Add libraries only as needed
- `d3-cloud` for the word cloud toggle (only visualization that truly needs a library)
- Chart.js or a simple SVG bar chart for industry/seniority breakdowns
- Consider a lightweight reactive library (Alpine.js or htmx) if filter state management gets unwieldy

**Phase 3 (only if needed):** If the app grows complex enough to warrant it, migrate to a framework. But don't start there.

### Data Pipeline

```
SQLite DB (jobstreet_jobs.db)
    ↓
Python ETL script (build-time)
    ↓
Static JSON files:
  ├── skills-summary.json    (pre-aggregated counts by category)
  ├── jobs.json              (all jobs with key fields)
  ├── companies.json         (company/industry aggregates)
  ├── filters.json           (all unique filter values + counts)
  └── co-occurrence.json     (Phase 2: skill pairings)
    ↓
Static HTML/CSS/JS site
    ↓
Deploy to GitHub Pages / Netlify
```

This approach:
- Eliminates runtime server costs and complexity
- Makes the site instantly fast (everything is pre-computed)
- Is trivially deployable and hostable
- Can be rebuilt whenever the database is updated (add a shell script or GitHub Action)

### When to Add a Backend

Only when one of these becomes true:
- Dataset exceeds ~5000 jobs (client-side filtering slows down)
- You need user accounts or saved preferences
- You need real-time data (live scraping pipeline)

At that point: FastAPI + SQLite in read-only mode, with pre-computed summary tables.

### Caching Strategy

Not needed in Phase 1–2 (static files are inherently cached). In Phase 3 with a backend:
- HTTP cache headers on aggregated endpoints (data changes daily at most)
- Pre-computed summary tables in SQLite, rebuilt on each scrape run

---

## 5. Risk & Overengineering Warnings

**Do NOT build early:**
- Skill co-occurrence network graph (force-directed graphs are visually impressive but notoriously hard to make useful — most users won't know how to read them)
- Predictive analytics or ML-based recommendations (you don't have enough temporal data yet, and LLM-extracted skill data already provides most of the insight)
- User accounts, saved searches, or personalization (adds auth complexity for minimal early value)
- A Python/Node backend API before you've proven the frontend works with static data
- Custom charting from scratch with D3 (use Chart.js or simple SVG unless you need something very specific)

**Common traps in data-heavy dashboards:**
- **Too many charts on one page.** Every chart competes for attention. Start with one view (the ranked table) and add views only when users ask for them.
- **Filters that nobody uses.** Start with 3–4 high-value filters (work type, seniority, role category). Add more only when users hit limits.
- **Over-normalized data.** The LLM-extracted fields are semi-structured strings. A simple split-and-count is good enough for Phase 1. Don't build a full skill taxonomy before validating the product.
- **Premature mobile optimization.** Build desktop-first since the primary audience (students, faculty) will access this on laptops. Make it responsive but don't over-invest in mobile UX for Phase 1.
- **Framework lock-in.** Starting with React or Angular for what is essentially a filterable table is the single most common overengineering mistake in dashboards.

**Where complexity creeps in:**
- Skill string normalization (100+ edge cases). Start with the obvious merges and iterate.
- Multi-model analysis data (multiple LLMs per job). Pick one model's results for MVP; add model comparison later.
- Salary parsing (free-text field with many formats). Show raw salary strings first; parse later.

---

## 6. If You Only Build 3 Things

### 1. Ranked Skills Table with Category Tabs
**Why:** This single view answers the most important question for both audiences: "What skills does the market want?" A sortable table with counts by category (Languages, Frameworks, Tools, Concepts) is immediately useful, requires minimal code, and needs no libraries. It's the atomic unit of value.

### 2. Filter by Work Type + Seniority with Live Counts
**Why:** Turning one static table into a dynamic, personal tool. An internship-seeking student and a faculty member analyzing senior roles have completely different needs. Two filter dropdowns that update the table counts transform the site from "interesting" to "useful for me specifically."

### 3. Click-Through from Skill to Matching Jobs (with JobStreet Links)
**Why:** This closes the insight-to-action loop. Without it, students see "Python: 187 jobs" and have nowhere to go. With it, they click Python, scan 187 real job cards, and click through to apply on JobStreet. That's the complete user journey in three clicks: **see skills → filter → find jobs → apply.**

These three features together deliver 80% of the value with roughly 20% of the total effort across all phases. They validate the product concept, give students something genuinely useful, and create the foundation everything else builds on.
