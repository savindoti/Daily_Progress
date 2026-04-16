import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import { CalendarDays, FileSpreadsheet, LoaderCircle, PlusCircle, Edit3, Sun, Moon } from "lucide-react";
import { API_BASE_URL, DEFAULT_FORM, STATUS_OPTIONS } from "./constants";
import { downloadBlob, formatDuration, getStatusTone } from "./utils";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [exportDate, setExportDate] = useState("all");
  const [supports, setSupports] = useState([]);
  const [yesterdaySupports, setYesterdaySupports] = useState([]);
  const [summary, setSummary] = useState({
    pending_count: 0,
    ongoing_count: 0,
    resolved_count: 0,
    total_count: 0,
  });
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [contentScale, setContentScale] = useState(1);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return setContentScale(1);

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      // baseline design resolution
      const baseW = 1920;
      const baseH = 1080;

      const scaleW = cw / baseW;
      const scaleH = ch / baseH;
      // allow scaling up or down to best fit the viewport
      const scale = Math.min(scaleW, scaleH);
      setContentScale(Number(scale.toFixed(4)));
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [supports, yesterdaySupports, summary, showForm]);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    setFormData((current) => ({ ...current, date: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    void loadDashboard();
  }, [selectedDate]);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ date: selectedDate }).toString();
      const [dailyResponse, yesterdayResponse, summaryResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/supports/?${query}`),
        fetch(`${API_BASE_URL}/supports/yesterday/?${query}`),
        fetch(`${API_BASE_URL}/supports/summary/?${query}`),
      ]);

      if (!dailyResponse.ok || !yesterdayResponse.ok || !summaryResponse.ok) {
        throw new Error("Unable to load dashboard data.");
      }

      const [dailyData, yesterdayData, summaryData] = await Promise.all([
        dailyResponse.json(),
        yesterdayResponse.json(),
        summaryResponse.json(),
      ]);

      setSupports(dailyData);
      setYesterdaySupports(yesterdayData);
      setSummary(summaryData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editingId ? `${API_BASE_URL}/supports/${editingId}/` : `${API_BASE_URL}/supports/`;
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.detail || "Unable to create support.");
      }

      setFormData({ ...DEFAULT_FORM, date: selectedDate });
      setEditingId(null);
      setShowForm(false);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(support) {
    setEditingId(support.id);
    setFormData({
      date: support.date,
      province: support.province || "",
      district: support.district || "",
      municipality: support.municipality || "",
      details: support.details || "",
      organization_name: support.organization_name || "",
      contact_person: support.contact_person || "",
      contact_number: support.contact_number || "",
      status: support.status || "pending",
    });
    setShowForm(true);
  }

  async function updateStatus(id, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/supports/${id}/status/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Unable to update status.");
      }

      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function exportReport() {
    setExporting(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (exportDate !== "all") query.set("date", exportDate);

      const response = await fetch(`${API_BASE_URL}/supports/export/?${query.toString()}`);
      if (!response.ok) throw new Error("Unable to export report.");

      const blob = await response.blob();
      const filename = exportDate === "all" ? "support-report-all.xlsx" : `support-report-${exportDate}.xlsx`;
      downloadBlob(blob, filename);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setExporting(false);
    }
  }

  const statusCards = useMemo(
    () => [
      { label: "Total Support", value: summary.total_count, tone: "pending", meta: `${summary.pending_count} pending` },
      { label: "Ongoing", value: summary.ongoing_count, tone: "ongoing" },
      { label: "Resolved", value: summary.resolved_count, tone: "resolved" },
    ],
    [summary],
  );

  const renderElapsedTime = (support) => {
    const secondsSinceFetch = Math.max(0, Math.floor((now - Date.parse(support.updated_at)) / 1000));
    const elapsedSeconds = support.status === "resolved" ? support.elapsed_seconds : support.elapsed_seconds + secondsSinceFetch;
    return formatDuration(elapsedSeconds);
  };

  return (
    <div className="page-shell">
      <div className="page-card" ref={containerRef}>
        <div className="card-inner" style={{ transform: `scale(${contentScale})` }}>
          <div className="card-content" ref={contentRef}>
        <header className="top-bar">
          <div className="calendar-chip">
            <CalendarDays size={26} />
            <div>
              <span>{new Date(selectedDate).toLocaleDateString(undefined, { month: "long" })}</span>
              <strong>{new Date(selectedDate).getDate()}</strong>
            </div>
          </div>

          <div className="date-controls">
            <label htmlFor="selected-date">Date Selection Dropdown</label>
            <input
              id="selected-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          
          <div className="top-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setDarkMode((d) => !d)}
              aria-pressed={darkMode}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="status-card-row">
            {statusCards.map((card) => (
              <article key={card.label} className={`status-note status-note--${card.tone}`}>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                {card.meta ? <small>{card.meta}</small> : null}
              </article>
            ))}
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        <main className="dashboard-grid">
          <section className="daily-panel">
            <div className="section-header">
              <h1>Daily Tasks</h1>
            </div>

            <div className="task-table">
              <div className="task-table__head">
                <span className="col-sn">S.N.</span>
                <span className="col-details">Details</span>
                <span className="col-province">Province</span>
                <span className="col-district">District</span>
                <span className="col-local">Local Level</span>
                <span className="col-org">Organization</span>
                <span className="col-status">Status</span>
                <span className="col-timer">Timer</span>
                <span className="col-actions">Actions</span>
              </div>

              <div className="task-table__body">
                {loading ? (
                  <div className="loading-state">
                    <LoaderCircle className="spin" />
                    Loading support tasks...
                  </div>
                ) : supports.length ? (
                  supports.map((support, index) => (
                    <article className={`task-row tone-${getStatusTone(support.status)}`} key={support.id}>
                      <span className="cell cell--sn">{index + 1}</span>
                      <span className="cell cell--details">{support.details}</span>
                      <span className="cell">{support.province}</span>
                      <span className="cell">{support.district}</span>
                      <span className="cell">{support.municipality}</span>
                      <span className="cell">{support.organization_name}</span>
                      <div className={`cell cell--status`}>
                        <select value={support.status} onChange={(event) => updateStatus(support.id, event.target.value)}>
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="cell cell--timer">{renderElapsedTime(support)}</span>
                      <div className="cell cell--actions">
                        <button type="button" className="icon-btn" onClick={() => startEdit(support)} aria-label="Edit support">
                          <Edit3 size={16} />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No supports created for the selected date.</div>
                )}
              </div>
            </div>

            <div className="action-row">
              <button className="add-support-btn" type="button" onClick={() => setShowForm((current) => !current)}>
                <PlusCircle size={24} />
                Add new support
              </button>

              <div className="export-inline" role="region" aria-label="Export">
                <div className="export-controls">
                  <select aria-label="Export date" value={exportDate} onChange={(event) => setExportDate(event.target.value)}>
                    <option value="all">All date</option>
                    <option value={selectedDate}>Selected date</option>
                  </select>
                  <button type="button" className="primary-btn" onClick={exportReport} disabled={exporting} aria-label="Export report">
                    {exporting ? "Exporting..." : "Export report"}
                  </button>
                </div>
              </div>
            </div>

            {showForm ? (
              <form className="support-form" onSubmit={handleSubmit}>
                <h2>Add New Support</h2>
                <div className="form-grid">
                  <label>
                    <span>Date</span>
                    <input type="date" value={formData.date} onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))} required />
                  </label>
                  <label>
                    <span>Province</span>
                    <input type="text" value={formData.province} onChange={(event) => setFormData((current) => ({ ...current, province: event.target.value }))} required />
                  </label>
                  <label>
                    <span>District</span>
                    <input type="text" value={formData.district} onChange={(event) => setFormData((current) => ({ ...current, district: event.target.value }))} required />
                  </label>
                  <label>
                    <span>Municipality</span>
                    <input type="text" value={formData.municipality} onChange={(event) => setFormData((current) => ({ ...current, municipality: event.target.value }))} required />
                  </label>
                  <label className="wide">
                    <span>Details</span>
                    <textarea rows="3" value={formData.details} onChange={(event) => setFormData((current) => ({ ...current, details: event.target.value }))} required />
                  </label>
                  <label>
                    <span>Organization Name</span>
                    <input type="text" value={formData.organization_name} onChange={(event) => setFormData((current) => ({ ...current, organization_name: event.target.value }))} required />
                  </label>
                  <label>
                    <span>Contact Person</span>
                    <input type="text" value={formData.contact_person} onChange={(event) => setFormData((current) => ({ ...current, contact_person: event.target.value }))} required />
                  </label>
                  <label>
                    <span>Contact Number</span>
                    <input type="text" value={formData.contact_number} onChange={(event) => setFormData((current) => ({ ...current, contact_number: event.target.value }))} required />
                  </label>
                  <label>
                    <span>Status</span>
                    <select value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="ghost-btn" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn" disabled={saving}>
                    {saving ? "Saving..." : "Create Support"}
                  </button>
                </div>
              </form>
            ) : null}
          </section>

          <aside className="sidebar-panel">
            <div className="section-header section-header--side">
              <h2>Yesterdays Task</h2>
            </div>

            <div className="yesterday-list">
                {yesterdaySupports.length ? (
                  yesterdaySupports.map((support, index) => (
                    <article className={`task-row task-row--compact tone-${getStatusTone(support.status)}`} key={support.id}>
                      <span className="cell cell--sn">{index + 1}</span>
                      <div className="cell-stack">
                        <strong>{support.details}</strong>
                        <span>{support.province}, {support.district}, {support.organization_name}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state empty-state--compact">No yesterday tasks.</div>
                )}
            </div>

            {/* export panel moved inline next to Add button */}
          </aside>
        </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
