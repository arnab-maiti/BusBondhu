export default function BusCard({ bus, onSelectBus }) {
  const isLowSeat = bus.seatsAvailable <= 5;

  const amenityIcons = {
    wifi: { icon: "📶", label: "Wi-Fi" },
    charging: { icon: "🔌", label: "Charging Point" },
    water: { icon: "💧", label: "Water" },
    blanket: { icon: "🛌", label: "Blanket" },
    reading_light: { icon: "💡", label: "Reading Light" },
    cctv: { icon: "📹", label: "CCTV" },
    live_tracking: { icon: "📍", label: "Live GPS" },
  };

  return (
    <article className="bus-result-card" aria-label={`${bus.operatorName} ${bus.busType}`}>
      {/* Top Meta Header: Operator & Rating */}
      <div className="card-top-row">
        <div className="operator-block">
          <div className="operator-logo-mark" aria-hidden="true">
            {bus.operatorName.charAt(0)}
          </div>
          <div>
            <h3 className="operator-name">{bus.operatorName}</h3>
            <p className="bus-type-desc">{bus.busType}</p>
          </div>
        </div>

        <div className="rating-and-badges">
          {bus.isLiveTrackable && (
            <span className="live-gps-badge" title="Live tracking feed enabled">
              <span className="live-gps-pulse" aria-hidden="true" />
              Live Trackable
            </span>
          )}
          <span className="operator-rating-chip" aria-label={`Rating ${bus.rating} out of 5 stars`}>
            ★ {bus.rating} <small>({bus.reviewsCount})</small>
          </span>
        </div>
      </div>

      {/* Middle Schedule Block: Departure, Journey Line, Arrival */}
      <div className="schedule-block">
        {/* Departure */}
        <div className="station-col departure">
          <span className="schedule-time">{bus.departureTime}</span>
          <span className="city-name">{bus.originCity}</span>
          <span className="station-point" title={bus.boardingPoint}>{bus.boardingPoint}</span>
        </div>

        {/* Travel Timeline Indicator */}
        <div className="duration-indicator" aria-label={`Travel duration: ${bus.duration}`}>
          <span className="duration-text">{bus.duration}</span>
          <div className="timeline-line">
            <span className="timeline-dot start" />
            <span className="timeline-bus-icon" aria-hidden="true">🚌</span>
            <span className="timeline-dot end" />
          </div>
          <span className="travel-mode">Direct Service</span>
        </div>

        {/* Arrival */}
        <div className="station-col arrival">
          <span className="schedule-time">{bus.arrivalTime}</span>
          <span className="city-name">{bus.destinationCity}</span>
          <span className="station-point" title={bus.droppingPoint}>{bus.droppingPoint}</span>
        </div>
      </div>

      {/* Amenities & Features Row */}
      <div className="amenities-row" aria-label="Available Amenities">
        {bus.amenities?.map((key) => {
          const item = amenityIcons[key];
          if (!item) return null;
          return (
            <span key={key} className="amenity-tag" title={item.label}>
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </span>
          );
        })}
      </div>

      {/* Bottom Footer: Price, Seats, and Selection CTA */}
      <div className="card-footer-row">
        <div className="seat-availability-block">
          <span className={`seats-left-pill ${isLowSeat ? "urgency" : "plenty"}`}>
            <span className="seat-icon" aria-hidden="true">💺</span>
            <strong>{bus.seatsAvailable}</strong> {bus.seatsAvailable === 1 ? "seat left" : "seats left"}
          </span>
          {isLowSeat && <span className="urgency-sub">Selling fast!</span>}
        </div>

        <div className="fare-and-cta-block">
          <div className="fare-container">
            <span className="fare-label">Starting from</span>
            <div className="fare-amount">
              <span className="currency">₹</span>
              <span className="price">{bus.fare}</span>
            </div>
          </div>

          <button
            type="button"
            className="select-seats-cta"
            onClick={() => onSelectBus(bus)}
            aria-label={`Select seats for ${bus.operatorName} at ₹${bus.fare}`}
          >
            <span>Select Seats</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
