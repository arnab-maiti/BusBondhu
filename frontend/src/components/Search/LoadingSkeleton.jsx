export default function LoadingSkeleton() {
  return (
    <div className="skeleton-container" aria-label="Loading bus schedules" role="status">
      {[1, 2, 3].map((idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-row header-skeleton">
            <div className="skeleton-box logo-skeleton" />
            <div className="skeleton-lines">
              <div className="skeleton-line title-line" />
              <div className="skeleton-line sub-line" />
            </div>
            <div className="skeleton-box rating-skeleton" />
          </div>

          <div className="skeleton-row schedule-skeleton">
            <div className="skeleton-col">
              <div className="skeleton-line time-line" />
              <div className="skeleton-line text-line" />
            </div>
            <div className="skeleton-timeline">
              <div className="skeleton-line duration-line" />
              <div className="skeleton-bar" />
            </div>
            <div className="skeleton-col">
              <div className="skeleton-line time-line" />
              <div className="skeleton-line text-line" />
            </div>
          </div>

          <div className="skeleton-row footer-skeleton">
            <div className="skeleton-box badge-skeleton" />
            <div className="skeleton-box price-skeleton" />
            <div className="skeleton-box btn-skeleton" />
          </div>
        </div>
      ))}
      <span className="sr-only">Finding available bus schedules...</span>
    </div>
  );
}
