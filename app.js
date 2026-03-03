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
  let companiesData = {};
  let coOccurrenceData = {};

  let activeView = "skills"; // "skills" | "companies" | "seniority" | "search-results"
  let activeTab = "All";
  let activeFilters = {
    workType: new Set(),
    seniority: new Set(),
    roleCategory: new Set(),
    industry: new Set(),
    companyType: new Set(),
  };
  let activeTimeRange = null;
  let activeTimeRangeKey = "all";
  let sortField = "count";
  let sortAsc = false;
  let searchQuery = "";
  let searchResults = [];

  const TIME_RANGES = [
    { key: "all", label: "All time", months: null },
    { key: "12m", label: "Last 12 months", months: 12 },
    { key: "6m", label: "Last 6 months", months: 6 },
    { key: "3m", label: "Last 3 months", months: 3 },
    { key: "1m", label: "Last month", months: 1 },
  ];

  const FILTER_DIMENSIONS = ["workType", "seniority", "roleCategory", "industry", "companyType"];

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
  const drillCooccurrence = document.getElementById("drill-cooccurrence");
  const coOccurrenceList = document.getElementById("co-occurrence-list");
  const filterReset = document.getElementById("filter-reset");
  const timeRangeBar = document.getElementById("time-range");
  const viewBar = document.querySelector(".view-bar");
  const searchInput = document.getElementById("search-input");
  const themeToggle = document.getElementById("theme-toggle");
  const wordcloudToggle = document.getElementById("toggle-wordcloud");
  const wordcloudPanel = document.getElementById("wordcloud-panel");
  const wordcloudSvg = document.getElementById("wordcloud-svg");

  // --- Init ---
  async function init() {
    initTheme();

    const [skillsRes, jobsRes, filtersRes, companiesRes, cooccurrenceRes] = await Promise.all([
      fetch("data/skills-summary.json"),
      fetch("data/jobs.json"),
      fetch("data/filters.json"),
      fetch("data/companies.json"),
      fetch("data/co-occurrence.json"),
    ]);

    skillsSummary = await skillsRes.json();
    allJobs = await jobsRes.json();
    filtersData = await filtersRes.json();
    companiesData = await companiesRes.json();
    coOccurrenceData = await cooccurrenceRes.json();

    loadStateFromURL();

    renderHeaderStats();
    renderTimeRange();
    renderTabs();
    renderFilters();
    renderActiveView();

    // Restore search input if loaded from URL
    if (searchQuery) {
      searchInput.value = searchQuery;
    }

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
    viewBar.addEventListener("click", handleViewClick);
    themeToggle.addEventListener("click", toggleTheme);
    wordcloudToggle.addEventListener("click", handleWordcloudToggle);

    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = searchInput.value.trim().toLowerCase();
        if (searchQuery.length < 2) {
          if (activeView === "search-results") switchView("skills");
          searchResults = [];
          pushStateToURL();
          return;
        }
        performSearch(searchQuery);
      }, 250);
    });
  }

  // ================================================================
  // THEME
  // ================================================================
  function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.classList.add(saved);
    }
    updateThemeToggle(saved || "auto");
  }

  function toggleTheme() {
    const html = document.documentElement;
    const current = localStorage.getItem("theme");
    let next;
    if (!current) {
      next = "light";
      html.classList.add("light");
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else if (current === "light") {
      next = "dark";
      html.classList.add("dark");
      html.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      next = "auto";
      html.classList.remove("dark", "light");
      localStorage.removeItem("theme");
    }
    updateThemeToggle(next);
  }

  function updateThemeToggle(mode) {
    const labels = { auto: "Auto", light: "Light", dark: "Dark" };
    themeToggle.dataset.theme = mode;
    themeToggle.querySelector(".theme-label").textContent = labels[mode];
    themeToggle.setAttribute("aria-label", `Theme: ${labels[mode]}. Click to change.`);
  }

  // ================================================================
  // URL QUERY PARAMETERS
  // ================================================================
  function pushStateToURL() {
    const params = new URLSearchParams();
    if (activeView !== "skills") params.set("view", activeView);
    if (activeTab !== "All") params.set("tab", activeTab);
    if (activeTimeRangeKey !== "all") params.set("time", activeTimeRangeKey);
    if (searchQuery) params.set("q", searchQuery);
    if (sortField !== "count") params.set("sort", sortField);
    if (sortAsc) params.set("asc", "1");

    for (const key of FILTER_DIMENSIONS) {
      if (activeFilters[key].size > 0) {
        params.set(key, [...activeFilters[key]].join(","));
      }
    }

    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    history.replaceState(null, "", url);
  }

  function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.has("view")) activeView = params.get("view");
    if (params.has("tab")) activeTab = params.get("tab");
    if (params.has("sort")) sortField = params.get("sort");
    if (params.has("asc")) sortAsc = params.get("asc") === "1";

    if (params.has("time")) {
      activeTimeRangeKey = params.get("time");
      const tr = TIME_RANGES.find((t) => t.key === activeTimeRangeKey);
      activeTimeRange = tr ? getCutoffDate(tr.months) : null;
    }

    if (params.has("q")) {
      searchQuery = params.get("q");
    }

    for (const key of FILTER_DIMENSIONS) {
      if (params.has(key)) {
        activeFilters[key] = new Set(params.get(key).split(","));
      }
    }
  }

  // ================================================================
  // HEADER STATS
  // ================================================================
  function renderHeaderStats() {
    const jobsWithSkills = allJobs.filter((j) => Object.keys(j.skills).length > 0).length;
    headerStats.innerHTML =
      `<span><span class="stat-value">${allJobs.length.toLocaleString()}</span> jobs</span>` +
      `<span><span class="stat-value">${jobsWithSkills.toLocaleString()}</span> analyzed</span>` +
      `<span><span class="stat-value">${Object.keys(skillsSummary).length - 1}</span> categories</span>`;
  }

  // ================================================================
  // TIME RANGE
  // ================================================================
  function getCutoffDate(months) {
    if (months === null) return null;
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.toISOString();
  }

  function renderTimeRange() {
    const counts = TIME_RANGES.map((tr) => {
      const cutoff = getCutoffDate(tr.months);
      return cutoff ? allJobs.filter((j) => j.date && j.date >= cutoff).length : allJobs.length;
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
    renderActiveView();
    pushStateToURL();
  }

  // ================================================================
  // TABS
  // ================================================================
  function renderTabs() {
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
    if (wordcloudToggle.getAttribute("aria-pressed") === "true") {
      renderWordCloud();
    }
    pushStateToURL();
  }

  // ================================================================
  // VIEW SWITCHING
  // ================================================================
  function handleViewClick(e) {
    const btn = e.target.closest(".view-btn");
    if (!btn) return;
    switchView(btn.dataset.view);
  }

  function switchView(view) {
    activeView = view;

    viewBar.querySelectorAll(".view-btn").forEach((b) =>
      b.setAttribute("aria-selected", b.dataset.view === activeView)
    );

    // Show/hide panels
    document.querySelectorAll(".view-panel").forEach((p) => (p.hidden = true));

    const panelId =
      activeView === "skills" ? "skills-panel" :
      activeView === "companies" ? "companies-panel" :
      activeView === "seniority" ? "seniority-panel" :
      activeView === "search-results" ? "search-panel" :
      "skills-panel";

    const panel = document.getElementById(panelId);
    if (panel) panel.hidden = false;

    renderActiveView();
    pushStateToURL();
  }

  function renderActiveView() {
    if (activeView === "skills") renderTable();
    else if (activeView === "companies") renderCompaniesView();
    else if (activeView === "seniority") renderSeniorityView();
    else if (activeView === "search-results") renderSearchResults();
  }

  // ================================================================
  // FILTERS
  // ================================================================
  function renderFilters() {
    renderFilterGroup("filter-work-type", "workType", filtersData.workType);
    renderFilterGroup("filter-seniority", "seniority", filtersData.seniority);
    renderFilterGroup("filter-role-category", "roleCategory", filtersData.roleCategory);
    renderFilterGroup("filter-industry", "industry", filtersData.industry || []);
    renderFilterGroup("filter-company-type", "companyType", filtersData.companyType || []);
  }

  function renderFilterGroup(containerId, filterKey, options) {
    const container = document.getElementById(containerId);
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
        renderActiveView();
        pushStateToURL();
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
    for (const dim of FILTER_DIMENSIONS) {
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
          else if (dim === "industry" && (job.industry || "") === value) count++;
          else if (dim === "companyType" && (job.companyType || "") === value) count++;
        }
        span.textContent = count;
        span.closest(".filter-option").classList.toggle("zero-count", count === 0);
      });
    }
  }

  function jobPassesFiltersExcept(job, excludeDim) {
    if (!jobPassesTimeRange(job)) return false;
    for (const dim of FILTER_DIMENSIONS) {
      if (dim === excludeDim) continue;
      const filterSet = activeFilters[dim];
      if (filterSet.size === 0) continue;
      if (!jobMatchesDimension(job, dim, filterSet)) return false;
    }
    return true;
  }

  function jobMatchesDimension(job, dim, filterSet) {
    if (dim === "workType") return job.workTypes.some((wt) => filterSet.has(wt));
    if (dim === "seniority") return job.seniority.some((s) => filterSet.has(s));
    if (dim === "roleCategory") return filterSet.has(job.roleCategory);
    if (dim === "industry") return filterSet.has(job.industry || "");
    if (dim === "companyType") return filterSet.has(job.companyType || "");
    return true;
  }

  function getFilteredJobIndices() {
    const indices = new Set();
    for (let i = 0; i < allJobs.length; i++) {
      if (jobPassesFilters(allJobs[i])) indices.add(i);
    }
    return indices;
  }

  function jobPassesTimeRange(job) {
    if (!activeTimeRange) return true;
    return job.date && job.date >= activeTimeRange;
  }

  function jobPassesFilters(job) {
    if (!jobPassesTimeRange(job)) return false;
    for (const dim of FILTER_DIMENSIONS) {
      const filterSet = activeFilters[dim];
      if (filterSet.size === 0) continue;
      if (!jobMatchesDimension(job, dim, filterSet)) return false;
    }
    return true;
  }

  function clearFilters() {
    for (const dim of FILTER_DIMENSIONS) activeFilters[dim].clear();
    activeTimeRange = null;
    activeTimeRangeKey = "all";

    document.querySelectorAll(".filter-option input").forEach((cb) => {
      cb.checked = false;
    });

    timeRangeBar.querySelectorAll(".time-pill").forEach((p) =>
      p.setAttribute("aria-pressed", p.dataset.rangeKey === "all")
    );

    updateFilterResetVisibility();
    updateFilterCounts();
    renderActiveView();
    pushStateToURL();
  }

  function updateFilterResetVisibility() {
    const hasFilters =
      FILTER_DIMENSIONS.some((d) => activeFilters[d].size > 0) ||
      activeTimeRangeKey !== "all";
    filterReset.hidden = !hasFilters;
  }

  // ================================================================
  // SORTING
  // ================================================================
  function handleSort(e) {
    const btn = e.currentTarget;
    const field = btn.dataset.sort;

    if (field === sortField) {
      sortAsc = !sortAsc;
    } else {
      sortField = field;
      sortAsc = field === "skill";
    }

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
    pushStateToURL();
  }

  // ================================================================
  // SKILLS TABLE
  // ================================================================
  function renderTable() {
    const filteredJobIndices = getFilteredJobIndices();
    const skills = skillsSummary[activeTab] || [];

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

    filteredSkills.sort((a, b) => {
      let cmp = 0;
      if (sortField === "skill") cmp = a.skill.localeCompare(b.skill);
      else if (sortField === "count") cmp = a.filteredCount - b.filteredCount;
      else if (sortField === "pct") cmp = a.filteredPct - b.filteredPct;
      return sortAsc ? cmp : -cmp;
    });

    if (filteredSkills.length === 0) {
      tbody.innerHTML = "";
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
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

    tbody.querySelectorAll(".skill-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        openDrillDown(
          decodeURIComponent(link.dataset.skill),
          decodeURIComponent(link.dataset.category)
        );
      });
    });

    // Update tab counts
    tabBar.querySelectorAll(".tab-btn").forEach((btn) => {
      const cat = btn.dataset.category;
      const catSkills = skillsSummary[cat] || [];
      const count = catSkills.filter((s) =>
        s.jobIndices.some((idx) => filteredJobIndices.has(idx))
      ).length;
      btn.querySelector(".tab-count").textContent = count;
    });

    // Update wordcloud if visible
    if (wordcloudToggle.getAttribute("aria-pressed") === "true") {
      renderWordCloud();
    }
  }

  // ================================================================
  // BAR CHART RENDERER (shared)
  // ================================================================
  function renderBarChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const limit = options.limit || 20;
    const shown = data.slice(0, limit);
    const max = shown.length > 0 ? Math.max(...shown.map((d) => d.count)) : 1;

    container.innerHTML = shown
      .map((d) => {
        const width = max > 0 ? (d.count / max) * 100 : 0;
        return `<div class="bar-chart-row">
          <span class="bar-chart-label" title="${escapeHtml(d.value)}">${escapeHtml(d.value)}</span>
          <div class="bar-chart-track">
            <div class="bar-chart-fill" style="width:${width}%"></div>
          </div>
          <span class="bar-chart-value">${d.count}</span>
        </div>`;
      })
      .join("");
  }

  // ================================================================
  // COMPANIES & INDUSTRIES VIEW
  // ================================================================
  function renderCompaniesView() {
    const filteredIndices = getFilteredJobIndices();

    const industryCounts = {};
    const typeCounts = {};
    const companyCounts = {};
    const companyMeta = {};

    for (const idx of filteredIndices) {
      const job = allJobs[idx];
      const ind = job.industry || "";
      const ct = job.companyType || "";
      const comp = job.company || "";

      if (ind) industryCounts[ind] = (industryCounts[ind] || 0) + 1;
      if (ct) typeCounts[ct] = (typeCounts[ct] || 0) + 1;
      if (comp) {
        companyCounts[comp] = (companyCounts[comp] || 0) + 1;
        if (!companyMeta[comp]) companyMeta[comp] = { industry: ind, companyType: ct };
      }
    }

    const industries = Object.entries(industryCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    renderBarChart("industry-chart", industries, { limit: 15 });

    const types = Object.entries(typeCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    renderBarChart("company-type-chart", types);

    // Top companies table
    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const companiesTbody = document.getElementById("companies-tbody");
    companiesTbody.innerHTML = topCompanies
      .map(([name, count]) => {
        const meta = companyMeta[name] || {};
        return `<tr>
          <td>${escapeHtml(name)}</td>
          <td class="col-count">${count}</td>
          <td>${escapeHtml(meta.industry || "")}</td>
          <td>${escapeHtml(meta.companyType || "")}</td>
        </tr>`;
      })
      .join("");
  }

  // ================================================================
  // SENIORITY VIEW
  // ================================================================
  function renderSeniorityView() {
    const filteredIndices = getFilteredJobIndices();
    const counts = {};

    for (const idx of filteredIndices) {
      for (const s of allJobs[idx].seniority) {
        counts[s] = (counts[s] || 0) + 1;
      }
    }

    const order = ["Intern", "Entry-level", "Junior", "Mid-level", "Senior", "Lead", "Not specified"];
    const data = order.filter((s) => counts[s]).map((s) => ({ value: s, count: counts[s] }));

    renderBarChart("seniority-chart", data);
  }

  // ================================================================
  // SEARCH
  // ================================================================
  function performSearch(query) {
    const terms = query.split(/\s+/).filter(Boolean);

    const scored = allJobs.map((job, idx) => {
      let score = 0;
      const titleLower = (job.title || "").toLowerCase();
      const companyLower = (job.company || "").toLowerCase();
      const allSkills = Object.values(job.skills)
        .flat()
        .map((s) => s.toLowerCase());

      for (const term of terms) {
        if (titleLower.includes(term)) score += 10;
        if (companyLower.includes(term)) score += 5;
        if (allSkills.some((s) => s.includes(term))) score += 3;
        if ((job.snippet || "").toLowerCase().includes(term)) score += 1;
      }

      return { idx, score };
    });

    searchResults = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((s) => allJobs[s.idx]);

    switchView("search-results");
  }

  function renderSearchResults() {
    const status = document.getElementById("search-status");
    const list = document.getElementById("search-results");

    if (!searchQuery || searchQuery.length < 2) {
      status.textContent = "";
      list.innerHTML = "";
      return;
    }

    status.textContent =
      searchResults.length > 0
        ? `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${searchQuery}"`
        : `No results for "${searchQuery}"`;

    list.innerHTML = searchResults.map((job) => renderJobCard(job)).join("");
  }

  // ================================================================
  // WORD CLOUD
  // ================================================================
  function handleWordcloudToggle() {
    const pressed = wordcloudToggle.getAttribute("aria-pressed") === "true";
    wordcloudToggle.setAttribute("aria-pressed", !pressed);
    wordcloudPanel.hidden = pressed;
    if (!pressed) renderWordCloud();
  }

  function renderWordCloud() {
    const filteredJobIndices = getFilteredJobIndices();
    const skills = skillsSummary[activeTab] || [];

    const topSkills = skills
      .map((s) => ({
        skill: s.skill,
        count: s.jobIndices.filter((i) => filteredJobIndices.has(i)).length,
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    if (!topSkills.length) {
      wordcloudSvg.innerHTML = "";
      return;
    }

    const maxCount = topSkills[0].count;
    const minCount = topSkills[topSkills.length - 1].count;
    const width = wordcloudSvg.clientWidth || 600;
    const height = parseInt(getComputedStyle(wordcloudSvg).height) || 280;

    wordcloudSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const scale = (count) => {
      if (maxCount === minCount) return 20;
      return 11 + ((count - minCount) / (maxCount - minCount)) * 25;
    };

    const placed = [];
    const cx = width / 2;
    const cy = height / 2;

    function overlaps(a, b) {
      return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
    }

    const texts = topSkills.map((s) => {
      const fontSize = scale(s.count);
      const textWidth = s.skill.length * fontSize * 0.55;
      const textHeight = fontSize * 1.2;

      let x, y, angle = 0, radius = 0;
      let found = false;
      while (!found && radius < Math.max(width, height) / 2) {
        x = cx + radius * Math.cos(angle) - textWidth / 2;
        y = cy + radius * Math.sin(angle);

        const box = { x, y: y - textHeight, w: textWidth, h: textHeight };
        if (
          !placed.some((p) => overlaps(box, p)) &&
          x >= 0 && x + textWidth <= width &&
          y - textHeight >= 0 && y <= height
        ) {
          placed.push(box);
          found = true;
        }

        angle += 0.5;
        radius += 0.8;
      }

      if (!found) return "";

      const opacity = 0.5 + (s.count - minCount) / (maxCount - minCount || 1) * 0.5;
      return `<text x="${x}" y="${y}" font-size="${fontSize}"
              data-skill="${encodeURIComponent(s.skill)}"
              data-category="${encodeURIComponent(activeTab)}"
              fill="var(--clr-text-muted)"
              opacity="${opacity.toFixed(2)}"
              font-family="var(--font-body)">${escapeHtml(s.skill)}</text>`;
    });

    wordcloudSvg.innerHTML = texts.join("");

    wordcloudSvg.querySelectorAll("text").forEach((t) => {
      t.addEventListener("click", () => {
        openDrillDown(
          decodeURIComponent(t.dataset.skill),
          decodeURIComponent(t.dataset.category)
        );
      });
    });
  }

  // ================================================================
  // DRILL-DOWN DIALOG
  // ================================================================
  function openDrillDown(skillName, category) {
    const filteredJobIndices = getFilteredJobIndices();
    const skills = skillsSummary[category] || [];
    const skillData = skills.find((s) => s.skill === skillName);

    if (!skillData) return;

    const matchingIndices = skillData.jobIndices.filter((idx) => filteredJobIndices.has(idx));
    const matchingJobs = matchingIndices.map((idx) => allJobs[idx]);
    matchingJobs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    drillTitle.textContent = skillName;
    drillCount.textContent = `${matchingJobs.length} job${matchingJobs.length !== 1 ? "s" : ""}`;

    // Co-occurrence
    const coData = coOccurrenceData[skillName];
    if (coData && coData.length > 0) {
      coOccurrenceList.innerHTML = coData
        .map(
          (c) =>
            `<li><button type="button" class="co-occurrence-tag" data-skill="${encodeURIComponent(c.skill)}">${escapeHtml(c.skill)} <span class="co-pct">${c.pct}%</span></button></li>`
        )
        .join("");
      drillCooccurrence.hidden = false;

      coOccurrenceList.querySelectorAll(".co-occurrence-tag").forEach((tag) => {
        tag.addEventListener("click", () => {
          dialog.close();
          openDrillDown(decodeURIComponent(tag.dataset.skill), "All");
        });
      });
    } else {
      drillCooccurrence.hidden = true;
    }

    drillJobs.innerHTML = matchingJobs.map((job) => renderJobCard(job)).join("");
    dialog.showModal();
  }

  // ================================================================
  // SHARED JOB CARD RENDERER
  // ================================================================
  function renderJobCard(job) {
    const salaryDisplay = renderSalary(job);
    const meta = [
      job.company,
      job.workTypes.join(", "),
      salaryDisplay,
      job.arrangement,
      formatDate(job.date),
    ]
      .filter(Boolean)
      .map((m) => {
        if (m === salaryDisplay && job.parsedSalary) {
          return `<span class="job-card-salary">${escapeHtml(m)}</span>`;
        }
        return `<span>${escapeHtml(m)}</span>`;
      });

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

    const skillTags = renderSkillTags(job.skills);

    return `<li class="job-card${job.expired ? " job-card-expired" : ""}">
      <div class="job-card-header">
        <div class="job-card-title">${escapeHtml(job.title)}</div>
        ${expiredBadge}
      </div>
      <div class="job-card-meta">${meta.join("")}</div>
      ${skillTags}
      ${job.snippet ? `<div class="job-card-snippet">${escapeHtml(job.snippet)}</div>` : ""}
      ${descriptionHtml}
      <a class="job-card-link" href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer">${linkLabel} &#8599;</a>
    </li>`;
  }

  function renderSkillTags(skills) {
    if (!skills || Object.keys(skills).length === 0) return "";
    const tags = Object.entries(skills).flatMap(([cat, list]) =>
      list.map(
        (s) =>
          `<span class="skill-tag" title="${escapeHtml(cat)}">${escapeHtml(s)}</span>`
      )
    );
    if (tags.length === 0) return "";
    return `<div class="job-skills">${tags.join("")}</div>`;
  }

  function renderSalary(job) {
    if (job.parsedSalary) {
      const s = job.parsedSalary;
      const fmt = (n) =>
        n.toLocaleString("en-SG", {
          style: "currency",
          currency: "SGD",
          maximumFractionDigits: 0,
        });
      const per = s.period === "year" ? "/yr" : "/mo";
      return s.min === s.max ? `${fmt(s.min)}${per}` : `${fmt(s.min)} – ${fmt(s.max)}${per}`;
    }
    return job.salary || "";
  }

  // ================================================================
  // UTILITIES
  // ================================================================
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDescription(text) {
    if (!text) return "";
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
