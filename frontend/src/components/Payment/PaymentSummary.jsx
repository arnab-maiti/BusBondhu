export default function PaymentSummary({
  bookingData,
  selectedMethod,
  isProcessing,
  onPayNow,
  validationError,
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
    baseFare = 960,
    taxesAndFees = 48,
    totalAmount = 1008,
  } = bookingData || {};

  const getMethodDisplay = () => {
    switch (selectedMethod) {
      case "upi":
        return "UPI (Instant Transfer)";
      case "card":
        return "Credit / Debit Card";
      case "netbanking":
        return "Net Banking";
      case "wallet":
        return "Mobile Wallet";
      default:
        return "None Selected";
    }
  };

  const isMethodValid = Boolean(selectedMethod);

  return (
    <aside className="payment-summary-sidebar" aria-label="Booking and Payment Summary">
      <div className="summary-card-inner">
        <h3 className="summary-card-title">Booking Summary</h3>

        {/* Journey Details */}
        <div className="summary-journey-box">
          <div className="journey-route-row">
            <span className="route-city">{origin}</span>
            <span className="route-arrow" aria-hidden="true">→</span>
            <span className="route-city">{destination}</span>
          </div>

          <div className="journey-meta-row">
            <span className="meta-tag operator-tag">
              <strong>{operatorName}</strong>
            </span>
            <span className="meta-tag bus-tag">{busType}</span>
          </div>

          <div className="journey-time-row">
            <span className="meta-item">
              <span className="meta-icon" aria-hidden="true">📅</span>
              <span>{date}</span>
            </span>
            <span className="meta-item">
              <span className="meta-icon" aria-hidden="true">🕒</span>
              <span>{departureTime}</span>
            </span>
          </div>

          <div className="seats-info-row">
            <span className="seats-label">Seats ({passengerCount}):</span>
            <div className="seats-chips-wrap">
              {seats.map((seatId) => (
                <span key={seatId} className="seat-badge">
                  {seatId}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="fare-breakdown-box">
          <div className="fare-row">
            <span>Base Fare ({passengerCount} × ₹{farePerSeat})</span>
            <span className="fare-value">₹{baseFare}</span>
          </div>

          <div className="fare-row sub">
            <span>Taxes & GST (5%)</span>
            <span className="fare-value">₹{taxesAndFees}</span>
          </div>

          <div className="fare-row sub">
            <span>Convenience & Booking Fee</span>
            <span className="free-badge">FREE</span>
          </div>

          <div className="fare-divider" />

          <div className="fare-row total-row">
            <div>
              <span className="total-label">Total Amount</span>
              <span className="method-indicator">Method: {getMethodDisplay()}</span>
            </div>
            <div className="total-amount-box">
              <span className="total-currency">₹</span>
              <span className="total-number">{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Validation Warning */}
        {validationError && (
          <div className="payment-validation-alert" role="alert">
            <span>⚠️ {validationError}</span>
          </div>
        )}

        {/* Pay Now Button */}
        <button
          type="button"
          className="pay-now-button"
          disabled={!isMethodValid || isProcessing}
          onClick={onPayNow}
          aria-disabled={!isMethodValid || isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              <span>Simulating Payment...</span>
            </>
          ) : !isMethodValid ? (
            <span>Select Payment Method Above</span>
          ) : (
            <>
              <span className="btn-lock" aria-hidden="true">🔒</span>
              <span>Pay Now ₹{totalAmount}</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </>
          )}
        </button>

        {/* Trust Badges */}
        <div className="payment-trust-footer">
          <div className="trust-item">
            <span className="trust-icon" aria-hidden="true">🛡️</span>
            <span>Frontend demo only • No real funds charged</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon" aria-hidden="true">⚡</span>
            <span>Instant booking simulation for Bengal transit</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
