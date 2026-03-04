#!/usr/bin/env python3
"""
ETL script: reads jobstreet_jobs.db and produces static JSON files
for the SGTechSkillz dashboard.

Output files (in data/):
  - skills-summary.json   Pre-aggregated skill counts by category
  - jobs.json             All jobs with key fields + extracted skills
  - filters.json          Unique filter values with counts
  - companies.json        Pre-aggregated company/industry data
  - co-occurrence.json    Per-skill co-occurring skills
"""

import json
import os
import re
import sqlite3
from collections import Counter, defaultdict
from itertools import combinations

DB_PATH = os.path.join(os.path.dirname(__file__), "jobstreet_jobs.db")
OUT_DIR = os.path.join(os.path.dirname(__file__), "data")

# Skill categories mapped from DB columns
CS_SKILL_COLUMNS = {
    "programming_languages": "Languages",
    "frameworks_libraries": "Frameworks",
    "tools_technologies": "Tools",
    "development_concepts": "Concepts",
    "domain_knowledge": "Domain",
}

BA_SKILL_COLUMNS = {
    "design_skills": "Design",
    "tools_technologies": "Tools",
    "research_methods": "Research",
    "design_concepts": "Concepts",
    "domain_knowledge": "Domain",
}

# --- Normalization maps ---

SKILL_NORMALIZE = {
    # .NET family
    ".Net": ".NET",
    ".Net Core": ".NET Core",
    ".Net Framework": ".NET Framework",
    "ASP.Net MVC": "ASP.NET MVC",
    "VB.Net": "VB.NET",
    # 3D / Design tools
    "3DS Max": "3ds Max",
    "Autocad": "AutoCAD",
    "Auto-Cad": "AutoCAD",
    "CAD Software": "CAD software",
    "Capcut": "CapCut",
    "Davinci Resolve": "DaVinci Resolve",
    "Hubspot": "HubSpot",
    "Sketchup": "SketchUp",
    "Sketch-up": "SketchUp",
    "Protopie": "ProtoPie",
    "Powerpoint": "PowerPoint",
    "Solarwinds": "SolarWinds",
    "Unifi": "UniFi",
    # Languages & frameworks
    "Typescript": "TypeScript",
    "Javascript": "JavaScript",
    "Pytorch": "PyTorch",
    "Golang": "Go",
    "GoLang": "Go",
    "JQuery": "jQuery",
    "Junit": "JUnit",
    "Vue.JS": "Vue.js",
    "webpack": "Webpack",
    "Websockets": "WebSockets",
    "xCode": "Xcode",
    "Gitlab": "GitLab",
    "Gitlab CI/CD": "GitLab CI/CD",
    "Github Actions": "GitHub Actions",
    "BitBucket": "Bitbucket",
    "Cloudformation": "CloudFormation",
    "Cloudfront": "CloudFront",
    "Cloudwatch": "CloudWatch",
    "Cocoapods": "CocoaPods",
    "EtherCat": "EtherCAT",
    "Profinet": "ProfiNet",
    "Martech": "MarTech",
    # CI/CD consolidation
    "CI/CD Pipelines": "CI/CD",
    "CI/CD pipelines": "CI/CD",
    # Case normalization — concepts & domains
    "async programming": "Async Programming",
    "asynchronous programming": "Asynchronous Programming",
    "Agile methodologies": "Agile Methodologies",
    "Agile methodology": "Agile Methodologies",
    "Agile Methodology": "Agile Methodologies",
    "AI tools": "AI Tools",
    "algorithms": "Algorithms",
    "attention to detail": "Attention to Detail",
    "automated testing": "Automated Testing",
    "Automated testing": "Automated Testing",
    "automation": "Automation",
    "capital markets": "Capital Markets",
    "Cloud computing": "Cloud Computing",
    "cloud platforms": "Cloud Platforms",
    "cloud services": "Cloud Services",
    "Cloud technologies": "Cloud Technologies",
    "compliance": "Compliance",
    "concurrency": "Concurrency",
    "CRM Systems": "CRM systems",
    "customer service": "Customer Service",
    "cybersecurity": "Cybersecurity",
    "data analytics": "Data Analytics",
    "data pipelines": "Data Pipelines",
    "data structures": "Data Structures",
    "databases": "Databases",
    "Design systems": "Design Systems",
    "Distributed systems": "Distributed Systems",
    "distributed systems": "Distributed Systems",
    "e-commerce": "E-commerce",
    "Embedded systems": "Embedded Systems",
    "ERP Systems": "ERP systems",
    "finance": "Finance",
    "FinTech": "Fintech",
    "Game development": "Game Development",
    "generative AI": "Generative AI",
    "Healthcare systems": "Healthcare Systems",
    "Information architecture": "Information Architecture",
    "Interaction design": "Interaction Design",
    "Interior design": "Interior Design",
    "IT infrastructure": "IT Infrastructure",
    "logistics": "Logistics",
    "machine learning": "Machine Learning",
    "MacOS": "macOS",
    "Microsoft Office suite": "Microsoft Office Suite",
    "Microsoft design guidelines": "Microsoft Design Guidelines",
    "Microsoft technologies": "Microsoft Technologies",
    "Motion design": "Motion Design",
    "MS suite": "MS Suite",
    "networking": "Networking",
    "numpy": "NumPy",
    "Object-Oriented Programming": "Object-oriented programming",
    "Object-Oriented Programming (OOP)": "Object-oriented programming (OOP)",
    "operating systems": "Operating Systems",
    "Pandas": "pandas",
    "performance optimization": "Performance Optimization",
    "problem-solving": "Problem-Solving",
    "Problem-solving": "Problem-Solving",
    "Prompt engineering": "Prompt Engineering",
    "Responsive design": "Responsive Design",
    "responsive design": "Responsive Design",
    "retail": "Retail",
    "risk": "Risk",
    "risk management": "Risk Management",
    "Scikit-Learn": "scikit-learn",
    "SCRUM": "Scrum",
    "security": "Security",
    "servers": "Servers",
    "Shell scripting": "Shell Scripting",
    "social media": "Social Media",
    "social media platforms": "Social Media Platforms",
    "state management": "State Management",
    "Statistical analysis": "Statistical Analysis",
    "sustainability": "Sustainability",
    "System design": "System Design",
    "Test-driven development": "Test-Driven Development",
    "testing": "Testing",
    "Tiktok": "TikTok",
    "Trade lifecycle": "Trade Lifecycle",
    "UI design": "UI Design",
    "User experience": "User Experience",
    "User flows": "User Flows",
    "User research": "User Research",
    "Visual design": "Visual Design",
    "visualization": "Visualization",
    # Platform case fixes
    "AZURE": "Azure",
    "HIVE": "Hive",
    "JIRA": "Jira",
    "QT": "Qt",
    "UNIX": "Unix",
    "UBUNTU": "Ubuntu",
    "CENTOS": "CentOS",
    "SoC": "SOC",
    "bash": "Bash",
    "matplotlib": "Matplotlib",
}

COMPANY_TYPE_NORMALIZE = {
    # MNC variants
    "Multinational Corporation (MNC)": "MNC",
    "Multinational Corporation": "MNC",
    "Multinational Conglomerate": "MNC",
    "MNC/Tech Company": "MNC",
    "MNC or Tech Company": "MNC",
    "Global Tech Company": "MNC",
    "Global Conglomerate": "MNC",
    "Global Investment Firm": "MNC",
    "Tech Company": "MNC",
    "Consumer-Facing Tech Company": "MNC",
    "Major Bank": "MNC",
    "Financial Services Company": "MNC",
    "Financial Services Firm": "MNC",
    "Financial Services Group": "MNC",
    "Financial Institution": "MNC",
    "Enterprise": "MNC",
    "Established Company": "MNC",
    "Game Studio, MNC": "MNC",
    "Agency, MNC": "MNC",
    # Startup
    "Fintech Startup": "Startup",
    "Scale-up": "Startup",
    # SME variants
    "Startup or SME": "SME",
    "Diversified SME": "SME",
    "Game Studio": "SME",
    "SaaS": "SME",
    "Media Company": "SME",
    "Media": "SME",
    "Restaurant Group": "SME",
    "General Business": "SME",
    "Business": "SME",
    "Robotics Company": "SME",
    "Brick-and-mortar business": "SME",
    "Software Company": "SME",
    "Workspace Provider": "SME",
    "Venture Capital": "SME",
    # Agency
    "Staffing Agency": "Agency",
    "Recruitment Agency": "Agency",
    # Consultancy
    "SME/Consultancy": "Consultancy",
    # Government / Education
    "Educational Institution": "Government",
    "Education": "Government",
    "University": "Government",
    "Government Agency": "Government",
    "Government-Linked Company": "Government",
    # Non-profit
    "Nonprofit": "Non-profit",
    "Non-profit": "Non-profit",
    "Non-profit Organization": "Non-profit",
    "Charity": "Non-profit",
    "Charity/Non-Profit": "Non-profit",
    "Social Enterprise": "Non-profit",
}

INDUSTRY_NORMALIZE = {
    # Food & Beverage
    "F&B": "Food & Beverage",
    "F&B, Retail": "Food & Beverage",
    "Food & Agriculture": "Food & Beverage",
    "Food Services / F&B": "Food & Beverage",
    "Food and Beverage": "Food & Beverage",
    "FoodTech": "Food & Beverage",
    "Agribusiness": "Food & Beverage",
    # E-commerce
    "Retail / eCommerce": "E-commerce",
    "eCommerce": "E-commerce",
    "E-commerce, Digital Entertainment": "E-commerce",
    "E-commerce, Digital Marketing": "E-commerce",
    "E-commerce, Digital Services": "E-commerce",
    "E-commerce, Tech": "E-commerce",
    "SaaS, E-commerce": "E-commerce",
    "Retail, E-commerce": "E-commerce",
    # Retail
    "Fashion/Retail": "Retail",
    "Apparel/Fashion": "Retail",
    "Apparel/Fashion Retail": "Retail",
    "Apparel & Fashion, Retail": "Retail",
    "Retail or Manufacturing": "Retail",
    "Retail, Travel": "Retail",
    "Luxury Goods": "Retail",
    "Luxury Retail": "Retail",
    "Furniture": "Retail",
    "Jewelry": "Retail",
    # Financial Services
    "Finance": "Financial Services",
    "Banking": "Financial Services",
    "Financial Services, Investment": "Financial Services",
    "Financial Services, Technology": "Financial Services",
    "Private Equity": "Financial Services",
    "Venture Capital": "Financial Services",
    # Artificial Intelligence
    "AI": "Artificial Intelligence",
    "AI/ML": "Artificial Intelligence",
    "AI /Robotics Education": "Artificial Intelligence",
    "Artificial Intelligence / Smart Automation": "Artificial Intelligence",
    "Robotics, AI": "Artificial Intelligence",
    "AI, Infrastructure": "Artificial Intelligence",
    "Technology, AI": "Artificial Intelligence",
    # IT Services
    "Computer and IT": "IT Services",
    "Technology": "IT Services",
    "Technology Services": "IT Services",
    "Technology/IT Services": "IT Services",
    "Technology/IT": "IT Services",
    "Technology/Software": "IT Services",
    "Technology/Computing": "IT Services",
    "Technology/Cloud Services": "IT Services",
    "Technology, Digital Services": "IT Services",
    "Technology, Internet Services": "IT Services",
    "Technology, SaaS": "IT Services",
    "Technology Consulting": "IT Services",
    "Tech": "IT Services",
    "Tech/IT": "IT Services",
    "Tech/Software": "IT Services",
    "ICT": "IT Services",
    "IT": "IT Services",
    "IT / Information Technology": "IT Services",
    "IT Services, Digital Solutions": "IT Services",
    "IT Services, SaaS": "IT Services",
    "IT Infrastructure": "IT Services",
    "Digital Tech": "IT Services",
    "Software Development": "IT Services",
    "Software": "IT Services",
    "Software Services": "IT Services",
    "Software & IT Services": "IT Services",
    "Software/IT Products": "IT Services",
    "Enterprise Software": "IT Services",
    "Enterprise Software, SaaS": "IT Services",
    "Enterprise Technology": "IT Services",
    "Enterprise IT": "IT Services",
    "FinTech, Enterprise Software": "IT Services",
    "EHS Software": "IT Services",
    "Infrastructure": "IT Services",
    # Recruitment
    "Staffing/Recruitment": "Recruitment",
    "Staffing & Recruitment": "Recruitment",
    "Staffing": "Recruitment",
    "BPO/Staffing Services": "Recruitment",
    "Business Process Outsourcing": "Recruitment",
    "HR Services": "Recruitment",
    # Events
    "Events Management": "Events",
    "Event Management": "Events",
    "Event Technology": "Events",
    "Events & Marketing": "Events",
    "Events/Experiential Marketing": "Events",
    # Advertising
    "Advertising / Event / Exhibit": "Advertising",
    "Digital Advertising": "Advertising",
    "Marketing/Advertising": "Advertising",
    "Marketing Agency": "Advertising",
    "adtech": "Advertising",
    # Marketing
    "Marketing Communications": "Marketing",
    # Consultancy
    "Consulting": "Consultancy",
    "Consulting, Fintech": "Consultancy",
    "Marketing/Consultancy": "Consultancy",
    # Architecture
    "Architecture/Design": "Architecture",
    "Architecture & Design": "Architecture",
    "Architecture or Design": "Architecture",
    # Construction
    "Architecture/Construction": "Construction",
    "Construction Technology": "Construction",
    "Construction, Architecture": "Construction",
    "Built Environment": "Construction",
    # Hospitality
    "Tourism/Hospitality": "Hospitality",
    "Hospitality/Tourism": "Hospitality",
    "Travel & Tourism": "Hospitality",
    "Travel & Hospitality": "Hospitality",
    "Travel and Hospitality": "Hospitality",
    "Travel, Hospitality, SaaS": "Hospitality",
    "Travel/Tech Fintech": "Hospitality",
    "Leisure": "Hospitality",
    # Healthcare
    "Beauty/Healthcare": "Healthcare",
    "Healthcare Technology": "Healthcare",
    "Biomedical / Pharmaceutical": "Healthcare",
    # Biotechnology
    "Biotech": "Biotechnology",
    # Beauty
    "Beauty & Personal Care": "Beauty",
    "Cosmetics": "Beauty",
    "Fitness": "Beauty",
    # Education
    "Education & Training": "Education",
    "Education/Tech": "Education",
    "Education/Public Services": "Education",
    "Education Technology (EdTech)": "Education",
    "EdTech": "Education",
    "EdTech, SaaS": "Education",
    "EdTech, IT Services": "Education",
    "Higher Education": "Education",
    # Robotics
    "Robotics, Automation": "Robotics",
    "Robotics, Technology": "Robotics",
    "Robotics/Automation": "Robotics",
    "Robotics and Electronics": "Robotics",
    "Automation and Control Systems": "Robotics",
    "Automation": "Robotics",
    "Industrial Automation": "Robotics",
    # Manufacturing
    "Industrial Technology": "Manufacturing",
    "Industrial Manufacturing": "Manufacturing",
    "Industrial": "Manufacturing",
    "Manufacturing General": "Manufacturing",
    "Electronics, Manufacturing": "Manufacturing",
    "Engineering/Industrial": "Manufacturing",
    "Engineering / Technical Services": "Manufacturing",
    "Engineering": "Manufacturing",
    "Heavy Machinery": "Manufacturing",
    "Chemicals": "Manufacturing",
    # Electronics
    "Consumer Electronics": "Electronics",
    "Technology/Electronics": "Electronics",
    # Semiconductor
    "Semiconductors": "Semiconductor",
    # Real Estate
    "Smart Buildings Technology": "Real Estate",
    "Real Estate/PropTech": "Real Estate",
    "Real Estate/Hospitality Tech": "Real Estate",
    # Gaming
    "Gaming, Software": "Gaming",
    "Gaming, E-commerce": "Gaming",
    "Gaming, Hospitality": "Gaming",
    "Gaming, Fintech": "Gaming",
    "Toys & Games": "Gaming",
    "Toymaking": "Gaming",
    # Entertainment
    "Arts / Entertainment / Recreation": "Entertainment",
    "Arts / Entertainment": "Entertainment",
    "Arts and Crafts": "Entertainment",
    "Sports": "Entertainment",
    # Fintech
    "Fintech, Social Media": "Fintech",
    "Fintech, E-commerce": "Fintech",
    "Fintech, E-commerce, SaaS": "Fintech",
    "Fintech, Logistics, E-commerce": "Fintech",
    "Fintech, Retail": "Fintech",
    "Fintech, Cybersecurity": "Fintech",
    "Fintech, Media": "Fintech",
    "Fintech, Tech/Software": "Fintech",
    "Fintech or SaaS": "Fintech",
    # Cybersecurity
    "Cybersecurity, Digital Identity": "Cybersecurity",
    "Cybersecurity, Defence, SaaS": "Cybersecurity",
    "Cybersecurity, E-commerce, Media": "Cybersecurity",
    "Cybersecurity, Fintech": "Cybersecurity",
    "Cybersecurity, Gaming": "Cybersecurity",
    "Cybersecurity, Networking": "Cybersecurity",
    "Cybersecurity, SaaS": "Cybersecurity",
    "Security": "Cybersecurity",
    "Security Services": "Cybersecurity",
    "Security Technology": "Cybersecurity",
    "Safety & Security": "Cybersecurity",
    "Defense, Security, Technology": "Cybersecurity",
    "Security, Facilities Management, Customer Experience Technology": "Cybersecurity",
    # Logistics
    "Logistics, Cybersecurity": "Logistics",
    "Logistics, E-commerce": "Logistics",
    "Transportation": "Logistics",
    "Automotive/Transportation": "Logistics",
    "Public Transport": "Logistics",
    "Transportation/Autonomous Tech": "Logistics",
    "Rail": "Logistics",
    "Maritime Technology": "Logistics",
    "Maritime Tech, B2B": "Logistics",
    "Maritime Tech, B2B Tech": "Logistics",
    # SaaS
    "SaaS, Media": "SaaS",
    "SaaS, Cybersecurity": "SaaS",
    # Media
    "Social Media": "Media",
    "Creative / Media": "Media",
    "Photography": "Media",
    "Lifestyle": "Media",
    # Professional Services
    "Business Services": "Professional Services",
    "Corporate Services": "Professional Services",
    "Legal Tech": "Professional Services",
    # Government / Public Sector
    "Public Sector": "Government",
    "Public Services": "Government",
    "Government Services": "Government",
    "GovTech": "Government",
    # Design
    "Design": "Design",
    # Telecommunications
    "Telecommunications, Cybersecurity": "Telecommunications",
    "Technology, Telecommunications": "Telecommunications",
    "Telecom": "Telecommunications",
    # Energy
    "Energy, Sustainability": "Energy",
    "Energy Technology": "Energy",
    "Water Technology": "Energy",
    "Utilities": "Energy",
    # Consumer Goods
    "FMCG": "Consumer Goods",
    # Wholesale
    "Wholesale Trade": "Wholesale",
    # Research
    "Research & Development": "Research",
    # Automotive
    "Mobility": "Automotive",
    # Social Services
    "Community Services": "Social Services",
    # Catch-all
    "Not specified": "Other",
    "Others": "Other",
    "Various": "Other",
    "Development": "Other",
    "Other": "Other",
    "Cleaning Services": "Other",
}


def normalize_skill(s):
    """Normalize a skill name to its canonical form."""
    return SKILL_NORMALIZE.get(s, s)


def normalize_company_type(ct):
    """Normalize company type to a small set of categories."""
    if not ct:
        return ""
    return COMPANY_TYPE_NORMALIZE.get(ct, ct)


def normalize_industry(ind):
    """Normalize industry to reduce fragmentation."""
    if not ind:
        return ""
    return INDUSTRY_NORMALIZE.get(ind, ind)


def parse_salary(raw):
    """Parse a salary string into {min, max, period} or None."""
    if not raw:
        return None
    cleaned = raw.replace(",", "").replace("SGD", "").replace("$", "").strip()
    nums = re.findall(r"(\d+(?:\.\d+)?)", cleaned)
    if not nums:
        return None
    nums = [float(n) for n in nums]
    period = "year" if "year" in raw.lower() else "month"
    if len(nums) >= 2:
        return {"min": nums[0], "max": nums[1], "period": period}
    return {"min": nums[0], "max": nums[0], "period": period}


def parse_json_field(value):
    """Parse a JSON array field, returning a list of strings."""
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [s.strip() for s in parsed if isinstance(s, str) and s.strip()]
        return []
    except (json.JSONDecodeError, TypeError):
        # Try comma-separated fallback
        return [s.strip() for s in value.split(",") if s.strip()]


def normalize_work_type(wt):
    """Split compound work types and normalize."""
    if not wt:
        return ["Unknown"]
    parts = [p.strip() for p in wt.split(",")]
    normalized = []
    for p in parts:
        p_lower = p.lower()
        if "full" in p_lower:
            normalized.append("Full-time")
        elif "part" in p_lower:
            normalized.append("Part-time")
        elif "contract" in p_lower or "temp" in p_lower:
            normalized.append("Contract")
        elif "casual" in p_lower or "vacation" in p_lower:
            normalized.append("Casual")
        elif "intern" in p_lower:
            normalized.append("Internship")
        else:
            normalized.append(p)
    return list(dict.fromkeys(normalized))  # dedupe preserving order


def normalize_seniority(sen):
    """Normalize seniority level, splitting compound values."""
    if not sen or sen.lower() in ("not specified", ""):
        return ["Not specified"]
    # Handle slash, comma, "or", "to", "and" separators
    normalized = re.split(r"[,/]|\bor\b|\bto\b|\band\b", sen)
    valid = []
    for p in normalized:
        p_lower = p.strip().lower()
        if not p_lower or "not specified" in p_lower:
            continue
        if "junior" in p_lower:
            valid.append("Junior")
        elif "senior" in p_lower:
            valid.append("Senior")
        elif "lead" in p_lower or "manager" in p_lower:
            valid.append("Lead")
        elif "mid" in p_lower:
            valid.append("Mid-level")
        elif "intern" in p_lower or "trainee" in p_lower:
            valid.append("Intern")
        elif "fresh" in p_lower or "entry" in p_lower or "graduate" in p_lower:
            valid.append("Entry-level")
        elif "associate" in p_lower:
            valid.append("Junior")
        elif p.strip():
            valid.append(p.strip())
    # Dedupe preserving order
    valid = list(dict.fromkeys(valid))
    return valid if valid else ["Not specified"]


def derive_role_category(search_queries_json):
    """Derive a broad role category from the granular search queries."""
    if not search_queries_json:
        return "Other"
    try:
        queries = json.loads(search_queries_json)
    except (json.JSONDecodeError, TypeError):
        return "Other"

    text = " ".join(queries).lower()

    # Order matters: more specific patterns first
    if any(k in text for k in ["data scien", "machine learning", "ml engineer", "ai engineer", "deep learning"]):
        return "Data Science & AI"
    if any(k in text for k in ["data analy", "data engineer", "business intelligence", "product analyst"]):
        return "Data & Analytics"
    if any(k in text for k in ["ux", "ui", "user experience", "user interface", "product design", "interaction design"]):
        return "UX/UI Design"
    if any(k in text for k in ["game design", "game develop", "game program", "gameplay"]):
        return "Game Development"
    if any(k in text for k in ["devops", "sre", "site reliability", "platform engineer", "infrastructure"]):
        return "DevOps & Infrastructure"
    if any(k in text for k in ["security", "cybersec", "infosec", "penetration"]):
        return "Cybersecurity"
    if any(k in text for k in ["mobile", "ios", "android", "flutter", "react native"]):
        return "Mobile Development"
    if any(k in text for k in ["frontend", "front end", "front-end", "react developer", "web develop"]):
        return "Frontend Development"
    if any(k in text for k in ["backend", "back end", "back-end"]):
        return "Backend Development"
    if any(k in text for k in ["full stack", "fullstack", "full-stack"]):
        return "Full Stack Development"
    if any(k in text for k in ["software engineer", "software develop", "computer science", "cs graduate"]):
        return "Software Engineering"
    if any(k in text for k in ["business analy", "creative ba", "narrative design"]):
        return "Business & Creative"
    if any(k in text for k in ["qa", "quality assurance", "test engineer", "sdet"]):
        return "QA & Testing"
    if any(k in text for k in ["cloud", "aws", "azure", "gcp"]):
        return "Cloud Engineering"
    if any(k in text for k in ["intern", "internship", "fresh graduate", "entry level", "graduate"]):
        return "Entry Level / Intern"

    return "Other"


def run_etl():
    os.makedirs(OUT_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # ------------------------------------------------------------------
    # 1. Load all jobs
    # ------------------------------------------------------------------
    jobs_raw = conn.execute("""
        SELECT job_id, job_title, job_url, company_name, job_location,
               work_type, listing_date_iso, salary, work_arrangement,
               search_queries, listing_expired, description_snippet,
               full_description
        FROM jobs
    """).fetchall()

    print(f"Loaded {len(jobs_raw)} active jobs")

    # ------------------------------------------------------------------
    # 2. Load analyses keyed by job_id (pick first model per job)
    # ------------------------------------------------------------------
    cs_analyses = {}
    for row in conn.execute("SELECT * FROM job_cs_analysis"):
        jid = row["job_id"]
        if jid not in cs_analyses:
            cs_analyses[jid] = dict(row)

    ba_analyses = {}
    for row in conn.execute("SELECT * FROM job_ba_analysis"):
        jid = row["job_id"]
        if jid not in ba_analyses:
            ba_analyses[jid] = dict(row)

    company_analyses = {}
    for row in conn.execute("SELECT * FROM job_company_analysis"):
        jid = row["job_id"]
        if jid not in company_analyses:
            company_analyses[jid] = dict(row)

    print(f"  CS analyses: {len(cs_analyses)}, BA analyses: {len(ba_analyses)}, Company: {len(company_analyses)}")

    # ------------------------------------------------------------------
    # 3. Build jobs list with extracted skills
    # ------------------------------------------------------------------
    jobs = []
    skill_counter = defaultdict(Counter)   # category -> {skill: count}
    skill_to_jobs = defaultdict(set)       # "category::skill" -> set of job indices

    filter_work_type = Counter()
    filter_seniority = Counter()
    filter_role_cat = Counter()
    filter_industry = Counter()
    filter_company_type = Counter()

    for job_row in jobs_raw:
        jid = job_row["job_id"]
        job = {
            "id": jid,
            "title": job_row["job_title"],
            "url": job_row["job_url"],
            "company": job_row["company_name"],
            "location": job_row["job_location"],
            "workTypes": normalize_work_type(job_row["work_type"]),
            "date": job_row["listing_date_iso"],
            "salary": job_row["salary"] or "",
            "parsedSalary": parse_salary(job_row["salary"]),
            "arrangement": job_row["work_arrangement"],
            "snippet": job_row["description_snippet"],
            "description": job_row["full_description"] or "",
            "expired": bool(job_row["listing_expired"]),
            "skills": {},       # category -> [skill, ...]
            "seniority": [],
            "roleCategory": derive_role_category(job_row["search_queries"]),
        }

        # Extract seniority from whichever analysis exists
        sen = None
        if jid in cs_analyses:
            sen = cs_analyses[jid].get("seniority_level")
        elif jid in ba_analyses:
            sen = ba_analyses[jid].get("seniority_level")
        job["seniority"] = normalize_seniority(sen)

        # Extract skills from CS analysis (with normalization)
        if jid in cs_analyses:
            for col, cat in CS_SKILL_COLUMNS.items():
                skills = [normalize_skill(s) for s in parse_json_field(cs_analyses[jid].get(col))]
                if skills:
                    job["skills"].setdefault(cat, [])
                    job["skills"][cat].extend(skills)

        # Extract skills from BA analysis (with normalization)
        if jid in ba_analyses:
            for col, cat in BA_SKILL_COLUMNS.items():
                skills = [normalize_skill(s) for s in parse_json_field(ba_analyses[jid].get(col))]
                if skills:
                    job["skills"].setdefault(cat, [])
                    job["skills"][cat].extend(skills)

        # Dedupe skills per category
        for cat in job["skills"]:
            job["skills"][cat] = list(dict.fromkeys(job["skills"][cat]))

        # Company info (with normalization)
        if jid in company_analyses:
            ca = company_analyses[jid]
            job["industry"] = normalize_industry(ca.get("industry", ""))
            job["companyType"] = normalize_company_type(ca.get("company_type", ""))

        job_idx = len(jobs)
        jobs.append(job)

        # Aggregate skill counts
        for cat, skill_list in job["skills"].items():
            for skill in skill_list:
                skill_counter[cat][skill] += 1
                skill_to_jobs[f"{cat}::{skill}"].add(job_idx)

        # Aggregate filter counts
        for wt in job["workTypes"]:
            filter_work_type[wt] += 1
        for s in job["seniority"]:
            filter_seniority[s] += 1
        filter_role_cat[job["roleCategory"]] += 1
        if job.get("industry"):
            filter_industry[job["industry"]] += 1
        if job.get("companyType"):
            filter_company_type[job["companyType"]] += 1

    conn.close()

    total_jobs = len(jobs)
    jobs_with_skills = sum(1 for j in jobs if j["skills"])
    print(f"  Jobs with skills: {jobs_with_skills}/{total_jobs}")

    # ------------------------------------------------------------------
    # 4. Build skills-summary.json
    # ------------------------------------------------------------------
    skills_summary = {}
    for cat, counts in sorted(skill_counter.items()):
        skills_summary[cat] = [
            {
                "skill": skill,
                "count": count,
                "pct": round(count / total_jobs * 100, 1),
                "jobIndices": sorted(skill_to_jobs[f"{cat}::{skill}"]),
            }
            for skill, count in counts.most_common()
        ]

    # Also build an "All" aggregate across categories
    all_skills = Counter()
    all_skill_jobs = defaultdict(set)
    for cat, counts in skill_counter.items():
        for skill, count in counts.items():
            all_skills[skill] += count
            all_skill_jobs[skill] |= skill_to_jobs[f"{cat}::{skill}"]

    skills_summary["All"] = [
        {
            "skill": skill,
            "count": count,
            "pct": round(count / total_jobs * 100, 1),
            "jobIndices": sorted(all_skill_jobs[skill]),
        }
        for skill, count in all_skills.most_common()
    ]

    # ------------------------------------------------------------------
    # 5. Build co-occurrence.json
    # ------------------------------------------------------------------
    pair_counter = Counter()
    skill_job_count = Counter()  # total jobs per skill (for pct calculation)

    for job in jobs:
        all_job_skills = set()
        for cat_skills in job["skills"].values():
            all_job_skills.update(cat_skills)
        for s in all_job_skills:
            skill_job_count[s] += 1
        for a, b in combinations(sorted(all_job_skills), 2):
            pair_counter[(a, b)] += 1

    co_occurrence = defaultdict(list)
    for (a, b), count in pair_counter.items():
        if count >= 3:
            co_occurrence[a].append({"skill": b, "count": count})
            co_occurrence[b].append({"skill": a, "count": count})

    # Sort by count desc and keep top 8, add pct
    for skill in co_occurrence:
        entries = sorted(co_occurrence[skill], key=lambda x: -x["count"])[:8]
        total = skill_job_count[skill]
        for e in entries:
            e["pct"] = round(e["count"] / total * 100) if total else 0
        co_occurrence[skill] = entries

    print(f"  Co-occurrence: {len(co_occurrence)} skills with co-occurring pairs")

    # ------------------------------------------------------------------
    # 6. Build companies.json
    # ------------------------------------------------------------------
    industry_counter = Counter()
    type_counter = Counter()
    company_counter = Counter()
    company_meta = {}  # company_name -> {industry, companyType}

    for job in jobs:
        ind = job.get("industry", "")
        ct = job.get("companyType", "")
        comp = job.get("company", "")
        if ind:
            industry_counter[ind] += 1
        if ct:
            type_counter[ct] += 1
        if comp:
            company_counter[comp] += 1
            if comp not in company_meta:
                company_meta[comp] = {"industry": ind, "companyType": ct}

    companies_data = {
        "byIndustry": [
            {"value": v, "count": c}
            for v, c in industry_counter.most_common()
        ],
        "byCompanyType": [
            {"value": v, "count": c}
            for v, c in type_counter.most_common()
        ],
        "topCompanies": [
            {
                "name": name,
                "count": count,
                "industry": company_meta.get(name, {}).get("industry", ""),
                "companyType": company_meta.get(name, {}).get("companyType", ""),
            }
            for name, count in company_counter.most_common(30)
        ],
    }

    print(f"  Companies: {len(industry_counter)} industries, {len(type_counter)} types, {len(company_counter)} companies")

    # ------------------------------------------------------------------
    # 7. Build filters.json
    # ------------------------------------------------------------------
    filters = {
        "workType": [
            {"value": v, "count": c}
            for v, c in filter_work_type.most_common()
        ],
        "seniority": [
            {"value": v, "count": c}
            for v, c in filter_seniority.most_common()
        ],
        "roleCategory": [
            {"value": v, "count": c}
            for v, c in filter_role_cat.most_common()
        ],
        "industry": [
            {"value": v, "count": c}
            for v, c in filter_industry.most_common()
        ],
        "companyType": [
            {"value": v, "count": c}
            for v, c in filter_company_type.most_common()
        ],
    }

    # ------------------------------------------------------------------
    # 8. Write output files
    # ------------------------------------------------------------------
    with open(os.path.join(OUT_DIR, "skills-summary.json"), "w") as f:
        json.dump(skills_summary, f, separators=(",", ":"))
    print(f"  Wrote skills-summary.json ({len(skills_summary)} categories)")

    with open(os.path.join(OUT_DIR, "jobs.json"), "w") as f:
        json.dump(jobs, f, separators=(",", ":"))
    print(f"  Wrote jobs.json ({len(jobs)} jobs)")

    with open(os.path.join(OUT_DIR, "filters.json"), "w") as f:
        json.dump(filters, f, separators=(",", ":"))
    print(f"  Wrote filters.json")

    with open(os.path.join(OUT_DIR, "companies.json"), "w") as f:
        json.dump(companies_data, f, separators=(",", ":"))
    print(f"  Wrote companies.json")

    with open(os.path.join(OUT_DIR, "co-occurrence.json"), "w") as f:
        json.dump(dict(co_occurrence), f, separators=(",", ":"))
    print(f"  Wrote co-occurrence.json")

    # Print summary
    print("\n--- Skill Categories ---")
    for cat in sorted(skills_summary.keys()):
        items = skills_summary[cat]
        print(f"  {cat}: {len(items)} unique skills, top 5: {', '.join(s['skill'] for s in items[:5])}")

    print("\n--- Filters ---")
    for key, vals in filters.items():
        print(f"  {key}: {', '.join(f'{v['value']} ({v['count']})' for v in vals[:8])}")

    print("\n--- Co-occurrence (top 5 for Python) ---")
    if "Python" in co_occurrence:
        for e in co_occurrence["Python"][:5]:
            print(f"  Python + {e['skill']}: {e['count']} jobs ({e['pct']}%)")


if __name__ == "__main__":
    run_etl()
