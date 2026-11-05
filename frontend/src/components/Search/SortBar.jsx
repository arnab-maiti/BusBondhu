export default function SortBar({
  sortBy,
  onSortChange,
  resultsCount,
  onOpenMobileFilters,
  activeFiltersCount,
}) {
  const sortOptions = [
    { id: "departure_asc", label: "Earliest Departure", icon: "🕒" },
    { id: "fare_asc", label: "Lowest Fare", icon: "🏷️" },
    { id: "duration_asc", label: "Fastest Duration", icon: "⚡" },
    { id: "seats_desc", label: "Most Seats", icon: "💺" },
  ];

  return (
    <div className="sort-bar-container" aria-label="Sort and Results Count">
      <div className="results-count-badge">
        <span className="count-number">{resultsCount}</span>
        <span className="count-text">{resultsCount === 1 ? "Bus Found" : "Buses Available"}</span>
      </div>

      {/* Mobile filter open trigger */}
      <button
        type="button"
        className="mobile-filter-trigger"
        onClick={onOpenMobileFilters}
        aria-label="Open filter options"
      >
        <span aria-hidden="true">⚙️</span>
        <span>Filter Buses</span>
        {activeFiltersCount > 0 && (
          <span className="mobile-filter-count">{activeFiltersCount}</span>
        )}
      </button>

      {/* Desktop & Tablet Sort Pills */}
      <div className="sort-pills-group" role="tablist" aria-label="Sort results by">
        <span className="sort-label">Sort By:</span>
        {sortOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`sort-pill ${sortBy === opt.id ? "active" : ""}`}
            onClick={() => onSortChange(opt.id)}
            role="tab"
            aria-selected={sortBy === opt.id}
          >
            <span className="sort-pill-icon" aria-hidden="true">{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
