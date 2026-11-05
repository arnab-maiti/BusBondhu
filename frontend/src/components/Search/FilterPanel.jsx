export default function FilterPanel({
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
  filteredCount,
}) {
  const activeFiltersCount =
    (filters.departureTimes?.length || 0) +
    (filters.busTypes?.length || 0) +
    (filters.amenities?.length || 0) +
    (filters.maxPrice < 700 ? 1 : 0);

  const toggleArrayItem = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: next });
  };

  return (
    <aside className="filters-card" aria-label="Search Filters">
      <div className="filters-header">
        <div className="filters-title-row">
          <span className="filter-icon" aria-hidden="true">⚙️</span>
          <h3>Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="active-filter-badge">{activeFiltersCount}</span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            className="reset-filters-btn"
            onClick={onResetFilters}
          >
            Clear All
          </button>
        )}
      </div>

      <div className="filter-summary-info">
        Showing <strong>{filteredCount}</strong> of <strong>{totalResultsCount}</strong> buses
      </div>

      {/* 1. Departure Time */}
      <section className="filter-group">
        <h4 className="filter-group-title">Departure Time</h4>
        <div className="time-chips-grid">
          <button
            type="button"
            className={`time-chip-btn ${filters.departureTimes?.includes("morning") ? "selected" : ""}`}
            onClick={() => toggleArrayItem("departureTimes", "morning")}
            aria-pressed={filters.departureTimes?.includes("morning")}
          >
            <span className="time-icon">🌅</span>
            <span className="time-label">Morning</span>
            <span className="time-sub">06:00 - 12:00</span>
          </button>

          <button
            type="button"
            className={`time-chip-btn ${filters.departureTimes?.includes("afternoon") ? "selected" : ""}`}
            onClick={() => toggleArrayItem("departureTimes", "afternoon")}
            aria-pressed={filters.departureTimes?.includes("afternoon")}
          >
            <span className="time-icon">☀️</span>
            <span className="time-label">Afternoon</span>
            <span className="time-sub">12:00 - 18:00</span>
          </button>

          <button
            type="button"
            className={`time-chip-btn ${filters.departureTimes?.includes("evening") ? "selected" : ""}`}
            onClick={() => toggleArrayItem("departureTimes", "evening")}
            aria-pressed={filters.departureTimes?.includes("evening")}
          >
            <span className="time-icon">🌙</span>
            <span className="time-label">Evening / Night</span>
            <span className="time-sub">18:00 - 06:00</span>
          </button>
        </div>
      </section>

      {/* 2. Bus Type */}
      <section className="filter-group">
        <h4 className="filter-group-title">Bus Type & Class</h4>
        <div className="checkbox-list">
          <label className="clay-checkbox-label">
            <input
              type="checkbox"
              checked={filters.busTypes?.includes("ac") || false}
              onChange={() => toggleArrayItem("busTypes", "ac")}
            />
            <span className="clay-checkbox-custom" />
            <span className="checkbox-text">AC Coaches</span>
          </label>

          <label className="clay-checkbox-label">
            <input
              type="checkbox"
              checked={filters.busTypes?.includes("non_ac") || false}
              onChange={() => toggleArrayItem("busTypes", "non_ac")}
            />
            <span className="clay-checkbox-custom" />
            <span className="checkbox-text">Non-AC Express</span>
          </label>

          <label className="clay-checkbox-label">
            <input
              type="checkbox"
              checked={filters.busTypes?.includes("sleeper") || false}
              onChange={() => toggleArrayItem("busTypes", "sleeper")}
            />
            <span className="clay-checkbox-custom" />
            <span className="checkbox-text">Sleeper / Semi-Sleeper</span>
          </label>

          <label className="clay-checkbox-label">
            <input
              type="checkbox"
              checked={filters.busTypes?.includes("seater") || false}
              onChange={() => toggleArrayItem("busTypes", "seater")}
            />
            <span className="clay-checkbox-custom" />
            <span className="checkbox-text">Seater</span>
          </label>
        </div>
      </section>

      {/* 3. Price Filter */}
      <section className="filter-group">
        <div className="price-header-row">
          <h4 className="filter-group-title">Maximum Fare</h4>
          <span className="price-value-badge">₹{filters.maxPrice}</span>
        </div>
        <div className="price-slider-container">
          <input
            type="range"
            min={180}
            max={700}
            step={20}
            value={filters.maxPrice}
            onChange={(e) =>
              onFilterChange({ ...filters, maxPrice: Number(e.target.value) })
            }
            className="clay-range-slider"
            aria-label="Filter by maximum fare"
          />
          <div className="price-limits">
            <span>₹180</span>
            <span>₹700</span>
          </div>
        </div>
      </section>

      {/* 4. Amenities */}
      <section className="filter-group">
        <h4 className="filter-group-title">Amenities</h4>
        <div className="checkbox-list">
          <label className="clay-checkbox-label">
            <input
              type="checkbox"
              checked={filters.amenities?.includes("wifi") || false}
              onChange={() => toggleArrayItem("amenities", "wifi")}
            />
            <span className="clay-checkbox-custom" />
            <span className="checkbox-text">📶 Free Wi-Fi</span>
          </label>

          <label className="clay-checkbox-label">
            <input
              type="checkbox"
              checked={filters.amenities?.includes("charging") || false}
              onChange={() => toggleArrayItem("amenities", "charging")}
            />
            <span className="clay-checkbox-custom" />
            <span className="checkbox-text">🔌 Charging Point</span>
          </label>

          <label className="clay-checkbox-label">
            <input
              type="checkbox"
              checked={filters.amenities?.includes("water") || false}
              onChange={() => toggleArrayItem("amenities", "water")}
            />
            <span className="clay-checkbox-custom" />
            <span className="checkbox-text">💧 Mineral Water</span>
          </label>

          <label className="clay-checkbox-label">
            <input
              type="checkbox"
              checked={filters.amenities?.includes("blanket") || false}
              onChange={() => toggleArrayItem("amenities", "blanket")}
            />
            <span className="clay-checkbox-custom" />
            <span className="checkbox-text">🛌 Blanket / Linen</span>
          </label>

          <label className="clay-checkbox-label">
            <input
              type="checkbox"
              checked={filters.amenities?.includes("live_tracking") || false}
              onChange={() => toggleArrayItem("amenities", "live_tracking")}
            />
            <span className="clay-checkbox-custom" />
            <span className="checkbox-text">📍 Live GPS Tracking</span>
          </label>
        </div>
      </section>
    </aside>
  );
}
