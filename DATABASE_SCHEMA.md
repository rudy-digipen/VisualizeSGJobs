# SGTechSkillz Database Schema

## Overview
The `jobstreet_jobs.db` SQLite database stores job listings scraped from JobStreet Singapore, including detailed skill and company analysis performed by LLM models. The data is designed to help students and teachers explore CS graduate jobs, internships, and Business/Analysis roles.

## Tables

### 1. `jobs` — Core Job Listings
Primary table containing all scraped job postings. One record per unique job listing.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | INTEGER | Auto-increment primary key |
| `job_id` | TEXT | Unique JobStreet job identifier (foreign key reference for analysis tables) |
| `job_title` | TEXT | Position title (e.g., "Software Engineer", "Data Analyst Intern") |
| `job_url` | TEXT | Direct URL to the job posting on JobStreet |
| `company_name` | TEXT | Company recruiting for the role |
| `job_location` | TEXT | Geographic location in Singapore (e.g., "Singapore") |
| `work_type` | TEXT | Employment type ("Full-time", "Part-time", "Internship", "Temporary") |
| `listing_date_iso` | TEXT | ISO 8601 date when job was posted (YYYY-MM-DD) |
| `description_snippet` | TEXT | Short excerpt from the job description |
| `salary` | TEXT | Salary range if available (e.g., "$3,500–$5,500") |
| `bullet_points` | TEXT | Key requirements/highlights (JSON format or delimited) |
| `work_arrangement` | TEXT | Work location type ("On-site", "Remote", "Hybrid") |
| `job_category` | TEXT | JobStreet category classification |
| `logo_url` | TEXT | Company logo URL |
| `company_url` | TEXT | Company website URL |
| `full_description` | TEXT | Complete job description HTML/text |
| `search_queries` | TEXT | JSON array of which search queries returned this job (e.g., `["cs_graduate", "creative_ba"]`) |
| `date_scraped` | TEXT | When the job was scraped (ISO 8601 timestamp) |
| `listing_expired` | INTEGER | 0 = active, 1 = listing no longer available on JobStreet |

---

### 2. `search_history` — Scraping Metadata
Tracks each scraping run per search query. Useful for understanding data coverage and collection patterns.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | INTEGER | Auto-increment primary key |
| `search_query` | TEXT | The search query used (e.g., "CS Graduate Jobs", "Creative BA Internships") |
| `pages_scraped` | INTEGER | Number of result pages processed for this query |
| `jobs_found` | INTEGER | Total jobs returned by this query |
| `date_searched` | TEXT | When this search was executed (ISO 8601 timestamp) |

---

### 3. `job_cs_analysis` — Computer Science Skill Extraction
LLM-extracted technical skills for Computer Science roles. Uses (job_id, model) as composite primary key, allowing multiple LLM analyses per job.

| Column | Type | Purpose |
|--------|------|---------|
| `job_id` | TEXT | References `jobs.job_id` |
| `model` | TEXT | LLM model used for analysis (e.g., "deepseek-v3") |
| `programming_languages` | TEXT | Extracted languages (e.g., "Python, Java, JavaScript") — JSON or comma-separated |
| `frameworks_libraries` | TEXT | Frameworks/libraries (e.g., "React, Spring Boot, Django") |
| `tools_technologies` | TEXT | DevOps/tools (e.g., "Docker, Kubernetes, AWS") |
| `development_concepts` | TEXT | Concepts (e.g., "REST APIs, Microservices, OOP") |
| `domain_knowledge` | TEXT | Industry-specific knowledge (e.g., "Financial systems, Machine Learning") |
| `required_skills` | TEXT | Skills explicitly marked as required |
| `preferred_skills` | TEXT | Nice-to-have skills |
| `years_experience` | TEXT | Experience requirement (e.g., "3-5 years", "Fresh graduate") |
| `seniority_level` | TEXT | Inferred seniority (e.g., "Junior", "Mid-level", "Senior") |
| `analyzed_at` | TEXT | When this analysis was performed (ISO 8601 timestamp) |

---

### 4. `job_ba_analysis` — Business/Creative Analysis Skill Extraction
LLM-extracted skills for Business Analysis and Creative roles. Similar structure to CS analysis but tailored for BA/Design domains.

| Column | Type | Purpose |
|--------|------|---------|
| `job_id` | TEXT | References `jobs.job_id` |
| `model` | TEXT | LLM model used for analysis |
| `design_skills` | TEXT | Design-related skills (e.g., "UX/UI, Wireframing, User Research") |
| `tools_technologies` | TEXT | Design tools (e.g., "Figma, Adobe Creative Suite, Sketch") |
| `research_methods` | TEXT | Research methodologies (e.g., "User interviews, A/B testing, Analytics") |
| `design_concepts` | TEXT | Design concepts (e.g., "Design systems, Accessibility, Responsive design") |
| `domain_knowledge` | TEXT | Industry knowledge (e.g., "E-commerce, SaaS, FinTech") |
| `required_skills` | TEXT | Hard requirements |
| `preferred_skills` | TEXT | Nice-to-have skills |
| `portfolio_requirements` | TEXT | Whether portfolio/case studies required |
| `years_experience` | TEXT | Experience requirement |
| `seniority_level` | TEXT | Inferred seniority level |
| `analyzed_at` | TEXT | Analysis timestamp |

---

### 5. `job_company_analysis` — Company Context & Domain
LLM-extracted company information providing context about the employer and product.

| Column | Type | Purpose |
|--------|------|---------|
| `job_id` | TEXT | References `jobs.job_id` |
| `model` | TEXT | LLM model used for analysis |
| `company_type` | TEXT | Org type (e.g., "Startup", "MNC", "Government", "Non-profit") |
| `industry` | TEXT | Industry vertical (e.g., "FinTech", "E-commerce", "Healthcare Tech") |
| `product_type` | TEXT | What the company builds (e.g., "B2B SaaS platform", "Mobile app") |
| `product_description` | TEXT | Brief description of their product/service |
| `business_model` | TEXT | How they make money (e.g., "Subscription-based", "Marketplace") |
| `problem_domain` | TEXT | What problem they solve |
| `target_users` | TEXT | Customer/user base (e.g., "Small businesses", "Enterprise customers") |
| `analyzed_at` | TEXT | Analysis timestamp |

---

## Data Relationships

```
jobs (job_id)
├── job_cs_analysis (job_id, model)
├── job_ba_analysis (job_id, model)
└── job_company_analysis (job_id, model)

search_history (independent metadata)
```

Each job can have **multiple analyses** if analyzed by different LLM models (supporting model comparison).

---

## Key Features for Website Visualization

1. **Job Browsing**: Filter by work_type, work_arrangement, job_location, salary, company_name
2. **Skills Dashboard**: Visualize most common programming languages, frameworks, tools across jobs
3. **Career Pathways**: Show seniority progression (Junior → Mid → Senior) with required skills
4. **Company Explorer**: Browse companies, their industries, and what roles they're hiring
5. **Search Trends**: Use search_history to show job market volume over time
6. **Skill Recommendations**: Match student interests to job requirements using analysis tables
7. **Comparison**: Side-by-side skill requirements for different roles/companies

---

This schema enables rich data exploration for students discovering what skills employers seek and for educators building curriculum aligned with industry needs.
