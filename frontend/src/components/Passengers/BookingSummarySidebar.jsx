export default function BookingSummarySidebar({
  bookingData,
  isFormValid,
  onSubmit,
  isDemoFallback,
}) {
  const {
    origin = "Kolkata",
    destination = "Durgapur",
    operatorName = "SBSTC Express",
    busType = "Volvo AC Seater (2+2)",
    departureTime = "07:30 AM",
    date = "Today",
    seats = ["1A", "1B"],
    passengerCount = 2,
    farePerSeat = 480,
    totalFare = 960,
  } = bookingData || {};

  return (
    <aside className="passenger-summary-sidebar" aria-label="Journey and Fare Summary">
      <div className="summary-card-inner">
        <h3 className="summary-title">Booking Summary</h3>

        {/* Development Fallback Alert if applicable */}
        {isDemoFallback && (
          <div className="demo-fallback-badge" role="status">
            <span className="fallback-pill">DEMO FALLBACK</span>
            <span>Displaying development fixture booking data for UI demonstration.</span>
          </div>
        )}

        {/* Route Card */}
        <div className="summary-route-box">
          <div className="route-endpoints">
            <span className="route-city">{origin}</span>
            <span className="route-arrow" aria-hidden="true">→</span>
            <span className="route-city">{destination}</span>
          </div>

          <div className="route-operator-row">
            <span className="operator-chip">
              <strong>{operatorName}</strong>
            </span>
            <span className="bus-chip">{busType}</span>
          </div>

          <div className="route-schedule-row">
            <span className="schedule-item">
              <span className="item-icon" aria-hidden="true">📅</span>
              <span>{date}</span>
            </span>
            <span className="schedule-item">
              <span className="item-icon" aria-hidden="true">🕒</span>
              <span>{departureTime}</span>
            </span>
          </div>

          <div className="seats-display-row">
            <span className="seats-label">Seats ({passengerCount}):</span>
            <div className="seats-badges-wrap">
              {seats.map((seatId) => (
                <span key={seatId} className="seat-num-badge">
                  {seatId}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="summary-fare-box">
          <div className="fare-row">
            <span>Base Fare ({passengerCount} × ₹{farePerSeat})</span>
            <span className="fare-val">₹{totalFare}</span>
          </div>
          <div className="fare-row sub">
            <span>GST & Transit Charges</span>
            <span className="fare-free">Included</span>
          </div>
          <div className="fare-divider" />
          <div className="fare-row total">
            <span>Total Payable</span>
            <span className="total-val">₹{totalFare}</span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          type="button"
          className="continue-passenger-btn"
          disabled={!isFormValid}
          onClick={onSubmit}
          aria-disabled={!isFormValid}
        >
          <span>{isFormValid ? "Continue to Next Step →" : "Complete Passenger Details"}</span>
        </button>

        {!isFormValid && (
          <p className="form-incomplete-hint">
            Please fill in all passenger names, ages, and contact details above to continue.
          </p>
        )}

        <div className="summary-trust-notice">
          <span className="trust-icon" aria-hidden="true">🔒</span>
          <span>Passenger details are kept private & encrypted for transit safety.</span>
        </div>
      </div>
    </aside>
  );
}
