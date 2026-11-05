export default function BookingCard({ booking, onNavigate }) {
  const {
    id = "BB-BK-000000",
    operatorName = "SBSTC Express",
    busType = "Volvo AC Seater (2+2)",
    origin = "Kolkata",
    destination = "Durgapur",
    departureTime = "07:30 AM",
    arrivalTime = "10:45 AM",
    duration = "3h 15m",
    travelDate = "Today",
    seats = ["1A"],
    passengers = [],
    totalAmount = 504,
    paymentMethod = "UPI",
    status = "upcoming",
    statusLabel = "Upcoming • Confirmed",
    isSessionBooking = false,
  } = booking;

  const handleViewTicket = () => {
    if (onNavigate) {
      onNavigate("confirmation", {
        ...booking,
        bookingId: id,
      });
    }
  };

  const handleTrackBus = () => {
    if (onNavigate) {
      onNavigate("track", {
        tripId: booking.tripId || id,
        ...booking,
      });
    }
  };

  const handleBookAgain = () => {
    if (onNavigate) {
      onNavigate("search", {
        from: origin.split(" ")[0],
        to: destination.split(" ")[0],
      });
    }
  };

  return (
    <article className={`booking-clay-card status-${status}`} aria-labelledby={`booking-title-${id}`}>
      {/* Top Header Row: Operator, Reference & Status Badge */}
      <div className="card-top-row">
        <div className="operator-block">
          <span className="operator-icon" aria-hidden="true">🚌</span>
          <div>
            <h3 id={`booking-title-${id}`} className="operator-name">
              {operatorName}
            </h3>
            <span className="bus-category-sub">{busType}</span>
          </div>
        </div>

        <div className="status-badge-wrap">
          {isSessionBooking && (
            <span className="session-pill-tag">Just Booked</span>
          )}
          <span className={`status-pill pill-${status}`}>
            <span className="status-dot" aria-hidden="true">●</span>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Booking Reference Strip */}
      <div className="booking-ref-strip">
        <span className="ref-item">
          <span className="ref-label">Booking ID:</span>
          <span className="ref-value code-font">{id}</span>
        </span>
        <span className="ref-divider" aria-hidden="true">•</span>
        <span className="ref-item">
          <span className="ref-label">Date:</span>
          <span className="ref-value bold">{travelDate}</span>
        </span>
      </div>

      {/* Journey Timeline */}
      <div className="card-journey-row">
        <div className="journey-stop origin">
          <span className="time-text">{departureTime}</span>
          <span className="city-text">{origin}</span>
          <span className="point-sub">Boarding Point</span>
        </div>

        <div className="journey-path-graphic" aria-hidden="true">
          <span className="duration-tag">{duration}</span>
          <div className="path-bar">
            <span className="bar-circle start" />
            <span className="bar-line" />
            <span className="bar-arrow">→</span>
            <span className="bar-line" />
            <span className="bar-circle end" />
          </div>
        </div>

        <div className="journey-stop destination">
          <span className="time-text">{arrivalTime}</span>
          <span className="city-text">{destination}</span>
          <span className="point-sub">Destination</span>
        </div>
      </div>

      {/* Meta Grid: Seats, Passengers, Payment */}
      <div className="card-meta-grid">
        <div className="meta-box">
          <span className="box-label">Reserved Seats</span>
          <div className="seats-tag-group">
            {seats.map((seat) => (
              <span key={seat} className="seat-clay-tag">
                {seat}
              </span>
            ))}
          </div>
        </div>

        <div className="meta-box">
          <span className="box-label">Passenger(s)</span>
          <span className="box-val bold">
            {passengers && passengers.length > 0
              ? `${passengers[0].fullName}${passengers.length > 1 ? ` +${passengers.length - 1} more` : ""}`
              : `${seats.length} Passenger${seats.length > 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="meta-box">
          <span className="box-label">Total Fare Paid</span>
          <span className="box-val fare-price">₹{totalAmount}</span>
          <span className="pay-mode-sub">{paymentMethod}</span>
        </div>
      </div>

      {/* Action Footer */}
      <footer className="card-actions-footer">
        <div className="actions-left">
          {status === "upcoming" && (
            <button
              type="button"
              className="action-btn track-btn"
              onClick={handleTrackBus}
              aria-label={`Track bus for journey to ${destination}`}
            >
              <span aria-hidden="true">📍</span>
              <span>Track Bus</span>
            </button>
          )}

          {status === "completed" && (
            <button
              type="button"
              className="action-btn rebook-btn"
              onClick={handleBookAgain}
              aria-label={`Book again from ${origin} to ${destination}`}
            >
              <span aria-hidden="true">🔄</span>
              <span>Book Again</span>
            </button>
          )}

          {status === "cancelled" && (
            <span className="refund-status-note">
              ✓ Full refund processed to original payment method
            </span>
          )}
        </div>

        <div className="actions-right">
          <button
            type="button"
            className="action-btn ticket-btn"
            onClick={handleViewTicket}
            aria-label={`View e-ticket for booking ${id}`}
          >
            <span aria-hidden="true">🎟️</span>
            <span>{status === "upcoming" ? "View E-Ticket" : "View Ticket Slip"}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </footer>
    </article>
  );
}
