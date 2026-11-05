export default function ErrorState({ errorMessage, onRetry }) {
  return (
    <div className="error-results-card" role="alert">
      <div className="error-icon-circle" aria-hidden="true">
        ⚠️
      </div>
      <h3>Search Failed</h3>
      <p className="error-description">
        {errorMessage || "We encountered an error loading bus schedules. Please try again."}
      </p>

      <button
        type="button"
        className="retry-search-btn"
        onClick={onRetry}
      >
        <span aria-hidden="true">🔄</span>
        <span>Retry Search</span>
      </button>
    </div>
  );
}
