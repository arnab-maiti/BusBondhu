import { useState } from "react";

export default function SearchHeader({
  searchParams,
  onSearchSubmit,
  isSearching,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [from, setFrom] = useState(searchParams.from);
  const [to, setTo] = useState(searchParams.to);
  const [date, setDate] = useState(searchParams.date);
  const [passengers, setPassengers] = useState(searchParams.passengers || 1);
  const [validationError, setValidationError] = useState("");

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleDateShortcut = (daysFromToday) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromToday);
    const dateStr = target.toISOString().split("T")[0];
    setDate(dateStr);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) {
      setValidationError("Please enter both origin and destination cities.");
      return;
    }
    setValidationError("");
    onSearchSubmit({
      from: from.trim(),
      to: to.trim(),
      date,
      passengers: Number(passengers),
    });
    setIsExpanded(false);
  };

  // Format display date
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "Today";
    try {
      const d = new Date(dateString + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <section className="search-header-container" aria-label="Journey Search Bar">
      {/* Top Banner: Journey Summary Pill */}
      <div className="journey-summary-bar">
        <div className="summary-route">
          <span className="route-city">{searchParams.from}</span>
          <span className="route-arrow" aria-hidden="true">→</span>
          <span className="route-city">{searchParams.to}</span>
        </div>

        <div className="summary-meta">
          <span className="meta-item">
            <span className="meta-icon" aria-hidden="true">📅</span>
            <span>{formatDateDisplay(searchParams.date)}</span>
          </span>
          <span className="meta-item">
            <span className="meta-icon" aria-hidden="true">👥</span>
            <span>{searchParams.passengers} {searchParams.passengers === 1 ? "Passenger" : "Passengers"}</span>
          </span>
        </div>

        <button
          type="button"
          className="modify-search-btn"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? "Close" : "Modify Search"}</span>
          <span className="btn-chevron" aria-hidden="true">{isExpanded ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* Development Fixture Notice */}
      <div className="demo-notice-pill" role="status">
        <span className="notice-badge">DEMO FIXTURE</span>
        <span>Schedules and seat counts below are development fixtures for UI demonstration.</span>
      </div>

      {/* Expandable / In-place Edit Form */}
      {isExpanded && (
        <form className="search-edit-card" onSubmit={handleSubmit} noValidate>
          <div className="edit-form-grid">
            {/* Origin */}
            <label className="edit-input-field">
              <span className="field-label">From (Origin)</span>
              <div className="field-input-box">
                <span className="input-icon" aria-hidden="true">📍</span>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="e.g. Kolkata, Howrah"
                  required
                />
              </div>
            </label>

            {/* Swap Button */}
            <div className="swap-btn-container">
              <button
                type="button"
                className="swap-cities-btn"
                onClick={handleSwap}
                title="Swap origin and destination"
                aria-label="Swap origin and destination"
              >
                <span aria-hidden="true">⇄</span>
              </button>
            </div>

            {/* Destination */}
            <label className="edit-input-field">
              <span className="field-label">To (Destination)</span>
              <div className="field-input-box">
                <span className="input-icon" aria-hidden="true">🏁</span>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="e.g. Durgapur, Siliguri"
                  required
                />
              </div>
            </label>

            {/* Journey Date */}
            <label className="edit-input-field">
              <span className="field-label">Journey Date</span>
              <div className="field-input-box">
                <span className="input-icon" aria-hidden="true">📅</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </label>

            {/* Passengers */}
            <label className="edit-input-field">
              <span className="field-label">Passengers</span>
              <div className="field-input-box">
                <span className="input-icon" aria-hidden="true">👥</span>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                >
                  <option value={1}>1 Passenger</option>
                  <option value={2}>2 Passengers</option>
                  <option value={3}>3 Passengers</option>
                  <option value={4}>4 Passengers</option>
                  <option value={5}>5 Passengers</option>
                  <option value={6}>6 Passengers</option>
                </select>
              </div>
            </label>
          </div>

          {/* Quick Date Shortcuts */}
          <div className="date-shortcuts-row">
            <span className="shortcuts-label">Quick select:</span>
            <button
              type="button"
              className="date-chip"
              onClick={() => handleDateShortcut(0)}
            >
              Today
            </button>
            <button
              type="button"
              className="date-chip"
              onClick={() => handleDateShortcut(1)}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className="date-chip"
              onClick={() => handleDateShortcut(2)}
            >
              Day after
            </button>
          </div>

          {validationError && (
            <p className="search-validation-error" role="alert">
              ⚠️ {validationError}
            </p>
          )}

          <div className="edit-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setIsExpanded(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="update-search-btn"
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Update Search →"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
