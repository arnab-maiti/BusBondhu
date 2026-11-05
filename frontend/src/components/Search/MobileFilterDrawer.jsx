import FilterPanel from "./FilterPanel";

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
  filteredCount,
}) {
  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-backdrop" onClick={onClose} role="presentation">
      <div
        className="mobile-drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Filter Options"
      >
        <div className="drawer-handle-bar" aria-hidden="true">
          <span className="drawer-handle" />
        </div>

        <div className="drawer-header">
          <h3>Filter Bus Results</h3>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>

        <div className="drawer-content">
          <FilterPanel
            filters={filters}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            totalResultsCount={totalResultsCount}
            filteredCount={filteredCount}
          />
        </div>

        <div className="drawer-footer">
          <button
            type="button"
            className="drawer-apply-btn"
            onClick={onClose}
          >
            Show {filteredCount} {filteredCount === 1 ? "Bus" : "Buses"}
          </button>
        </div>
      </div>
    </div>
  );
}
