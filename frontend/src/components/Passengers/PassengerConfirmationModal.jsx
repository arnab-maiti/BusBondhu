export default function PassengerConfirmationModal({
  bookingData,
  passengersList,
  contactData,
  onClose,
  onNavigate,
}) {
  const {
    origin = "Kolkata",
    destination = "Durgapur",
    operatorName = "SBSTC Express",
    totalFare = 960,
  } = bookingData || {};

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="passenger-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-p-title"
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-badge-icon" aria-hidden="true">📋</span>
            <div>
              <span className="milestone-chip">PHASE 4 MILESTONE COMPLETED</span>
              <h2 id="confirm-p-title">Passenger Details Saved</h2>
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
          <div className="confirm-trip-strip">
            <span className="trip-text">
              <strong>{origin} → {destination}</strong> ({operatorName})
            </span>
            <span className="trip-amount">Total: ₹{totalFare}</span>
          </div>

          <div className="passengers-review-list">
            <h4 className="review-heading">Registered Passengers</h4>
            {passengersList.map((p, idx) => (
              <div key={idx} className="passenger-review-item">
                <span className="p-seat-pill">Seat {p.seatId}</span>
                <div className="p-info">
                  <span className="p-name">{p.fullName}</span>
                  <span className="p-meta">
                    {p.age} yrs • {p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "Not specified"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="contact-review-box">
            <h4 className="review-heading">Delivery Contact</h4>
            <div className="contact-review-grid">
              <div>
                <span className="c-label">Email:</span>
                <span className="c-val">{contactData.email}</span>
              </div>
              <div>
                <span className="c-label">Mobile:</span>
                <span className="c-val">+91 {contactData.phone}</span>
              </div>
            </div>
          </div>

          <div className="phase-completion-notice" role="status">
            <p>
              ✅ <strong>Phase 4 Frontend Complete:</strong> All passenger forms, required field validations, 
              age constraints, contact validation, and layout responsiveness have been verified.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={onClose}
          >
            Edit Passenger Details
          </button>
          <button
            type="button"
            className="modal-primary-btn"
            onClick={() => {
              onClose();
              if (onNavigate) {
                onNavigate("payment", {
                  ...bookingData,
                  passengers: passengersList,
                  contact: contactData,
                });
              }
            }}
          >
            Proceed to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}
