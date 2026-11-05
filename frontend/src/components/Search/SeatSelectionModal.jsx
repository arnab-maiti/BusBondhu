export default function SeatSelectionModal({
  selectedBus,
  onClose,
  searchParams,
  onNavigate,
}) {
  if (!selectedBus) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="seat-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-bus-icon" aria-hidden="true">🚌</span>
            <div>
              <h3 id="modal-title">Ready for Seat Selection</h3>
              <p className="modal-subtitle">{selectedBus.operatorName} — {selectedBus.busType}</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="selection-summary-box">
            <div className="summary-item">
              <span className="summary-label">Route</span>
              <span className="summary-value">
                {selectedBus.originCity} → {selectedBus.destinationCity}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Departure</span>
              <span className="summary-value">
                {selectedBus.departureTime} (Est. Arrival: {selectedBus.arrivalTime})
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Passengers</span>
              <span className="summary-value">
                {searchParams.passengers || 1} Person
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Base Fare</span>
              <span className="summary-value fare-highlight">
                ₹{selectedBus.fare} <small>per seat</small>
              </span>
            </div>
          </div>

          <div className="phase-notice-box">
            <span className="phase-pill">PHASE 2 MILESTONE</span>
            <p>
              Bus selection is confirmed for <strong>{selectedBus.busNumber}</strong>. 
              The interactive seat layout and passenger booking flow will be integrated in Phase 3.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={onClose}
          >
            Choose Another Bus
          </button>
          <button
            type="button"
            className="modal-primary-btn"
            onClick={() => {
              onClose();
              if (onNavigate) {
                onNavigate("seats", { tripId: selectedBus.id });
              } else {
                window.location.hash = `/trips/${selectedBus.id}/seats`;
              }
            }}
          >
            Select Seats on this Bus →
          </button>
        </div>
      </div>
    </div>
  );
}
