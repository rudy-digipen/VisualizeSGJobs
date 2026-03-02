/* ==========================================================
   SGTechSkillz — Dashboard Application
   Vanilla JS, no dependencies
   ========================================================== */

(function () {
  "use strict";

  // --- State ---
  let allJobs = [];
  let skillsSummary = {};
  let filtersData = {};

  let activeTab = "All";
  let activeFilters = { workType: new Set(), seniority: new Set(), roleCategory: new Set() };
  let activeTimeRange = null; // null = all time, otherwise a cutoff Date
  let activeTimeRangeKey = "all";
  let sortField = "count";
  let sortAsc = false; // default descending for count

  // Time range options — computed after data loads
  const TIME_RANGES = [
    { key: "all", label: "All time", months: null },
    { key: "12m", label: "Last 12 months", months: 12 },
    { key: "6m", label: "Last 6 months", months: 6 },
    { key: "3m", label: "Last 3 months", months: 3 },
    { key: "1m", label: "Last month", months: 1 },
  ];

  // --- DOM refs ---
  const headerStats = document.getElementById("header-stats");
  const tabBar = document.querySelector(".tab-bar");
  const tbody = document.getElementById("skills-tbody");
  const emptyState = document.getElementById("empty-state");
  const dialog = document.getElementById("drill-down");
  const drillTitle = document.getElementById("drill-title");
  const drillCount = document.getElementById("drill-count");
  const drillClose = document.getElementById("drill-close");
  const drillJobs = document.getElementById("drill-jobs");
  const filterReset = document.getElementById("filter-reset");
  const timeRangeBar = document.getElementById("time-range");

  // --- Init ---
  async function init() {
    const [skillsRes, jobsRes, filtersRes] = await Promise.all([
      fetch("data/skills-summary.json"),
      fetch("data/jobs.json"),
      fetch("data/filters.json"),
    ]);

    skillsSummary = await skillsRes.json();
    allJobs = await jobsRes.json();
    filtersData = await filtersRes.json();

    renderHeaderStats();
    renderTimeRange();
    renderTabs();
    renderFilters();
    renderTable();

    // Event listeners
    tabBar.addEventListener("click", handleTabClick);
    timeRangeBar.addEventListener("click", handleTimeRangeClick);
    document.querySelectorAll(".sort-btn").forEach((btn) =>
      btn.addEventListener("click", handleSort)
    );
    drillClose.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    filterReset.addEventListener("click", clearFilters);
  }

  // --- Header Stats ---
  function renderHeaderStats() {
    const jobsWithSkills = allJobs.filter((j) => Object.keys(j.skills).length > 0).length;
    headerStats.innerHTML =
      `<span><span class="stat-value">${allJobs.length.toLocaleString()}</span> jobs</span>` +
      `<span><span class="stat-value">${jobsWithSkills.toLocaleString()}</span> analyzed</span>` +
      `<span><span class="stat-value">${Object.keys(skillsSummary).length - 1}</span> categories</span>`;
  }

  // --- Time Range ---
  function getCutoffDate(months) {
    if (months === null) return null;
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.toISOString();
  }

  function renderTimeRange() {
    // Count jobs per time range
    const counts = TIME_RANGES.map((tr) => {
      const cutoff = getCutoffDate(tr.months);
      const count = cutoff
        ? allJobs.filter((j) => j.date && j.date >= cutoff).length
        : allJobs.length;
      return count;
    });

    timeRangeBar.innerHTML =
      '<span class="time-range-label">Posted</span>' +
      TIME_RANGES.map((tr, i) => {
        const selected = tr.key === activeTimeRangeKey;
        return `<button type="button" class="time-pill" aria-pressed="${selected}" data-range-key="${tr.key}" data-range-months="${tr.months}">
          ${tr.label}<span class="time-pill-count">${counts[i].toLocaleString()}</span>
        </button>`;
      }).join("");
  }

  function handleTimeRangeClick(e) {
    const pill = e.target.closest(".time-pill");
    if (!pill) return;

    activeTimeRangeKey = pill.dataset.rangeKey;
    const months = pill.dataset.rangeMonths === "null" ? null : Number(pill.dataset.rangeMonths);
    activeTimeRange = getCutoffDate(months);

    timeRangeBar.querySelectorAll(".time-pill").forEach((p) =>
      p.setAttribute("aria-pressed", p === pill)
    );

    updateFilterCounts();
    renderTable();
  }

  // --- Tabs ---
  function renderTabs() {
    // Order: All first, then alphabetical
    const categories = Object.keys(skillsSummary).sort((a, b) => {
      if (a === "All") return -1;
      if (b === "All") return 1;
      return a.localeCompare(b);
    });

    tabBar.innerHTML = categories
      .map((cat) => {
        const count = skillsSummary[cat].length;
        const selected = cat === activeTab;
        return `<button type="button" role="tab" class="tab-btn" aria-selected="${selected}" data-category="${cat}">
          ${cat}<span class="tab-count">${count}</span>
        </button>`;
      })
      .join("");
  }

  function handleTabClick(e) {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    activeTab = btn.dataset.category;
    tabBar.querySelectorAll(".tab-btn").forEach((b) =>
      b.setAttribute("aria-selected", b === btn)
    );
    renderTable();
  }

  // --- Filters ---
  function renderFilters() {
    renderFilterGroup("filter-work-type", "workType", filtersData.workType);
    renderFilterGroup("filter-seniority", "seniority", filtersData.seniority);
    renderFilterGroup("filter-role-category", "roleCategory", filtersData.roleCategory);
  }

  function renderFilterGroup(containerId, filterKey, options) {
    const container = document.getElementById(containerId);
    const legend = container.querySelector("legend");

    // Remove old options but keep legend
    container.querySelectorAll(".filter-option").forEach((el) => el.remove());

    options.forEach((opt) => {
      const label = document.createElement("label");
      label.className = "filter-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = opt.value;
      checkbox.checked = activeFilters[filterKey].has(opt.value);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          activeFilters[filterKey].add(opt.value);
        } else {
          activeFilters[filterKey].delete(opt.value);
        }
        updateFilterResetVisibility();
        updateFilterCounts();
        renderTable();
      });

      const nameSpan = document.createElement("span");
      nameSpan.textContent = opt.value;

      const countSpan = document.createElement("span");
      countSpan.className = "filter-count";
      countSpan.dataset.filterKey = filterKey;
      countSpan.dataset.filterValue = opt.value;
      countSpan.textContent = opt.count;

      label.append(checkbox, nameSpan, countSpan);
      container.appendChild(label);
    });
  }

  function updateFilterCounts() {
    // For each filter dimension, show counts with OTHER dimensions applied
    // but not the current dimension — so users see "available if I pick this"
    const dimensions = ["workType", "seniority", "roleCategory"];

    for (const dim of dimensions) {
      // Build a job set with all filters EXCEPT this dimension
      const crossFiltered = new Set();
      for (let i = 0; i < allJobs.length; i++) {
        if (jobPassesFiltersExcept(allJobs[i], dim)) crossFiltered.add(i);
      }

      document.querySelectorAll(`.filter-count[data-filter-key="${dim}"]`).forEach((span) => {
        const value = span.dataset.filterValue;
        let count = 0;
        for (const idx of crossFiltered) {
          const job = allJobs[idx];
          if (dim === "workType" && job.workTypes.includes(value)) count++;
          else if (dim === "seniority" && job.seniority.includes(value)) count++;
          else if (dim === "roleCategory" && job.roleCategory === value) count++;
        }
        span.textContent = count;
        span.closest(".filter-option").classList.toggle("zero-count", count === 0);
      });
    }
  }

  function jobPassesFiltersExcept(job, excludeDim) {
    if (!jobPassesTimeRange(job)) return false;
    const { workType, seniority, roleCategory } = activeFilters;
    if (excludeDim !== "workType" && workType.size > 0 && !job.workTypes.some((wt) => workType.has(wt))) return false;
    if (excludeDim !== "seniority" && seniority.size > 0 && !job.seniority.some((s) => seniority.has(s))) return false;
    if (excludeDim !== "roleCategory" && roleCategory.size > 0 && !roleCategory.has(job.roleCategory)) return false;
    return true;
  }

  function getFilteredJobIndices() {
    // Returns a Set of job indices that pass all active filters
    // When computing counts for a filter dimension, we exclude that dimension
    const indices = new Set();

    for (let i = 0; i < allJobs.length; i++) {
      if (jobPassesFilters(allJobs[i])) {
        indices.add(i);
      }
    }
    return indices;
  }

  function jobPassesTimeRange(job) {
    if (!activeTimeRange) return true;
    return job.date && job.date >= activeTimeRange;
  }

  function jobPassesFilters(job) {
    if (!jobPassesTimeRange(job)) return false;

    const { workType, seniority, roleCategory } = activeFilters;

    if (workType.size > 0 && !job.workTypes.some((wt) => workType.has(wt))) return false;
    if (seniority.size > 0 && !job.seniority.some((s) => seniority.has(s))) return false;
    if (roleCategory.size > 0 && !roleCategory.has(job.roleCategory)) return false;

    return true;
  }

  function clearFilters() {
    activeFilters.workType.clear();
    activeFilters.seniority.clear();
    activeFilters.roleCategory.clear();
    activeTimeRange = null;
    activeTimeRangeKey = "all";

    document.querySelectorAll(".filter-option input").forEach((cb) => {
      cb.checked = false;
    });

    // Reset time pills
    timeRangeBar.querySelectorAll(".time-pill").forEach((p) =>
      p.setAttribute("aria-pressed", p.dataset.rangeKey === "all")
    );

    updateFilterResetVisibility();
    updateFilterCounts();
    renderTable();
  }

  function updateFilterResetVisibility() {
    const hasFilters =
      activeFilters.workType.size > 0 ||
      activeFilters.seniority.size > 0 ||
      activeFilters.roleCategory.size > 0 ||
      activeTimeRangeKey !== "all";
    filterReset.hidden = !hasFilters;
  }

  // --- Sorting ---
  function handleSort(e) {
    const btn = e.currentTarget;
    const field = btn.dataset.sort;

    if (field === sortField) {
      sortAsc = !sortAsc;
    } else {
      sortField = field;
      sortAsc = field === "skill"; // alpha ascending by default, numeric descending
    }

    // Update button states
    document.querySelectorAll(".sort-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.sort === sortField);
      const indicator = b.querySelector(".sort-indicator");
      if (b.dataset.sort === sortField) {
        indicator.textContent = sortAsc ? "\u25B2" : "\u25BC";
      } else {
        indicator.textContent = "";
      }
    });

    renderTable();
  }

  // --- Table Rendering ---
  function renderTable() {
    const filteredJobIndices = getFilteredJobIndices();
    const skills = skillsSummary[activeTab] || [];

    // Recompute counts based on filtered jobs
    const filteredSkills = skills
      .map((s) => {
        const matchingJobs = s.jobIndices.filter((idx) => filteredJobIndices.has(idx));
        return {
          ...s,
          filteredCount: matchingJobs.length,
          filteredPct: filteredJobIndices.size > 0
            ? Math.round((matchingJobs.length / filteredJobIndices.size) * 1000) / 10
            : 0,
          filteredJobIndices: matchingJobs,
        };
      })
      .filter((s) => s.filteredCount > 0);

    // Sort
    filteredSkills.sort((a, b) => {
      let cmp = 0;
      if (sortField === "skill") {
        cmp = a.skill.localeCompare(b.skill);
      } else if (sortField === "count") {
        cmp = a.filteredCount - b.filteredCount;
      } else if (sortField === "pct") {
        cmp = a.filteredPct - b.filteredPct;
      }
      return sortAsc ? cmp : -cmp;
    });

    const maxCount = filteredSkills.length > 0 ? filteredSkills[0].filteredCount : 1;

    if (filteredSkills.length === 0) {
      tbody.innerHTML = "";
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    // Find the actual max for bar width (may differ after sort)
    const barMax = Math.max(...filteredSkills.map((s) => s.filteredCount));

    tbody.innerHTML = filteredSkills
      .map((s, i) => {
        const barWidth = barMax > 0 ? (s.filteredCount / barMax) * 100 : 0;
        return `<tr>
          <td class="col-rank">${i + 1}</td>
          <td class="col-skill">
            <a class="skill-link" href="#" data-skill="${encodeURIComponent(s.skill)}" data-category="${encodeURIComponent(activeTab)}">
              ${escapeHtml(s.skill)}
            </a>
          </td>
          <td class="col-count">${s.filteredCount}</td>
          <td class="col-pct">${s.filteredPct}%</td>
          <td class="bar-cell" aria-hidden="true">
            <div class="bar-track"><div class="bar-fill" style="width:${barWidth}%"></div></div>
          </td>
        </tr>`;
      })
      .join("");

    // Attach drill-down click handlers
    tbody.querySelectorAll(".skill-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const skill = decodeURIComponent(link.dataset.skill);
        const category = decodeURIComponent(link.dataset.category);
        openDrillDown(skill, category);
      });
    });

    // Update tab counts to reflect filtered state
    tabBar.querySelectorAll(".tab-btn").forEach((btn) => {
      const cat = btn.dataset.category;
      const catSkills = skillsSummary[cat] || [];
      const count = catSkills.filter((s) =>
        s.jobIndices.some((idx) => filteredJobIndices.has(idx))
      ).length;
      btn.querySelector(".tab-count").textContent = count;
    });
  }

  // --- Drill-Down Dialog ---
  function openDrillDown(skillName, category) {
    const filteredJobIndices = getFilteredJobIndices();
    const skills = skillsSummary[category] || [];
    const skillData = skills.find((s) => s.skill === skillName);

    if (!skillData) return;

    const matchingIndices = skillData.jobIndices.filter((idx) => filteredJobIndices.has(idx));
    const matchingJobs = matchingIndices.map((idx) => allJobs[idx]);

    // Sort by date descending
    matchingJobs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    drillTitle.textContent = skillName;
    drillCount.textContent = `${matchingJobs.length} job${matchingJobs.length !== 1 ? "s" : ""}`;

    drillJobs.innerHTML = matchingJobs
      .map((job) => {
        const meta = [
          job.company,
          job.workTypes.join(", "),
          job.salary,
          job.arrangement,
          formatDate(job.date),
        ]
          .filter(Boolean)
          .map(escapeHtml);

        const expiredBadge = job.expired
          ? '<span class="badge badge-expired">Listing expired</span>'
          : "";

        const linkLabel = job.expired
          ? "View on JobStreet (may no longer be available)"
          : "View on JobStreet";

        const descriptionHtml = job.description
          ? `<details class="job-description">
              <summary>View full description</summary>
              <div class="job-description-body">${formatDescription(job.description)}</div>
            </details>`
          : "";

        return `<li class="job-card${job.expired ? " job-card-expired" : ""}">
          <div class="job-card-header">
            <div class="job-card-title">${escapeHtml(job.title)}</div>
            ${expiredBadge}
          </div>
          <div class="job-card-meta">${meta.map((m) => `<span>${m}</span>`).join("")}</div>
          ${job.snippet ? `<div class="job-card-snippet">${escapeHtml(job.snippet)}</div>` : ""}
          ${descriptionHtml}
          <a class="job-card-link" href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer">${linkLabel} &#8599;</a>
        </li>`;
      })
      .join("");

    dialog.showModal();
  }

  // --- Utilities ---
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatDescription(text) {
    if (!text) return "";
    // Split into paragraphs on double newlines, or treat each line as a paragraph
    return escapeHtml(text)
      .split(/\n/)
      .filter((line) => line.trim())
      .map((line) => `<p>${line}</p>`)
      .join("");
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  }

  // --- Boot ---
  init().catch((err) => {
    console.error("Failed to initialize dashboard:", err);
    document.querySelector(".content").innerHTML =
      '<p class="empty-state">Failed to load data. Make sure to run <code>python3 etl.py</code> first.</p>';
  });
})();
