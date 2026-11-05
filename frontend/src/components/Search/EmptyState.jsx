export default function EmptyState({ onResetFilters, origin, destination }) {
  return (
    <div className="empty-results-card" role="status">
      <div className="empty-icon-circle" aria-hidden="true">
        🚌
      </div>
      <h3>No Bus Schedules Found</h3>
      <p className="empty-description">
        No bus services match your selected filters for{" "}
        <strong>{origin} → {destination}</strong>.
      </p>

      <div className="empty-suggestions">
        <p className="suggestions-title">Try adjusting your search:</p>
        <ul>
          <li>Relax your departure time or price limits</li>
          <li>Clear selected amenities or bus type filters</li>
          <li>Check that origin and destination cities are different</li>
        </ul>
      </div>

      <button
        type="button"
        className="reset-all-filters-btn"
        onClick={onResetFilters}
      >
        Clear All Filters & Show All Buses
      </button>
    </div>
  );
}
